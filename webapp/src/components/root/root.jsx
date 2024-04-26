import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import {CirclePicker, SketchPicker} from 'react-color';

import ReactPaint from '../paint';

import styles from './root.css';

const SMALL_SCREEN_WIDTH = 900;

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    position: 'absolute',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '10px',
    background: 'white',
  },
  overlay: {
    zIndex: 1000,
  }
};

// WIP must learn js and react first
// https://legacy.reactjs.org/docs/composition-vs-inheritance.html
// TODO bind 
// https://stackoverflow.com/questions/66590082/how-to-prevent-re-rendering-of-components-that-have-not-changed
/*
const CustomSketchPicker = () =>{
     const [color, setColor] = useState("#000000");

  return (
    <SketchPicker
                        color={color}
                        onChangeComplete={ (new_color)=>{ setColor(new_color);} }
                        disableAlpha={true}
                        />
);

}
*/
/*
class CustomSketchPicker extends React.Component{ 
    constructor(props){
        super(props);
        console.log("props "+JSON.stringify(props));
        this.isHidden=false;
        this.color=props["color"];
    }

    render(){
        if (this.isHidden){

            return <div>  <button
                            id='open_color_picker_button'
                            type='button'
                            className='btn'
                            onClick={() => {
                                this.isHidden=false;
                        }}
                            >
                        {'Open Color Picker'}
                        </button></div>
        }


        return  <div >

            <CustomSketchPicker
                        id='color_picker'
                        color={this.color}
                        onChangeComplete={ (color)=>{ this.color=color;} }
                        disableAlpha={true}
                        />
                       
                    <button
                            id='close_color_picker_button'
                            type='button'
                            className='btn'
                            onClick={() => {
                              this.isHidden=true; 

                             }}
                            >
                        {'Close Color Picker'}
                        </button> 
                    </div>
    
    }
}
*/

Modal.setAppElement('#root');

function dataURItoFile(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: 'image/png'});
    blob.lastModifiedDate = new Date();
    blob.name = 'drawing.png';
    return blob;
}

export default class Root extends React.Component {
    static propTypes = {
        visible: PropTypes.bool.isRequired,
        channelId: PropTypes.string.isRequired,
        rootId: PropTypes.string,
        userId: PropTypes.string.isRequired,
        close: PropTypes.func.isRequired,
        uploadFile: PropTypes.func.isRequired,
        createPost: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.paintRef = React.createRef();
        this.inputFileRef = React.createRef();
        let width = 850;
        let height = 600;
        if (this.isSmall()) {
            width = window.innerWidth - 50;
            height = window.innerHeight - 250;
        }

        this.state = {
            brushColor: '#000000',
            lineWidth: 2,
            imageData: null,
            history: [
                {
                    img: null,
                    width,
                    height,
                },
            ],
            historyCursor: 0,
        };
        this.isShowingColorPicker=false;
    }

    isSmall = () => {
        return window.innerWidth <= SMALL_SCREEN_WIDTH;
    }

    setColor = (color) => {
        this.setState({brushColor: color});
    }

    setLineWidth = (e) => {
        this.setState({lineWidth: e.target.value});
    }

    handleImage = (e) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            var img = new Image();
            img.onload = () => {
                this.paintRef.current.setImage(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }

    fill = (event) => {
     //   console.log("fill enter");
     //   console.log(event);
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
        // https://stackoverflow.com/questions/42932645/creating-and-saving-to-file-new-png-image-in-javascript
        let canvas = document.createElement("canvas");
        
        let history=this.state.history[0];
        canvas.width=history.width;
        canvas.height=history.height;

        const ctx = canvas.getContext("2d");
        console.log("fill: "+ JSON.stringify(this.state.brushColor));
        
        ctx.fillStyle = this.state.brushColor["hex"];
        ctx.fillRect(0,0,canvas.width,canvas.height);
        


      //  console.log("created canvas");

        let img = new Image();
        img.onload = () => {
            this.paintRef.current.setImage(img);
//        console.log("fill image loaded");
        };
        img.src = canvas.toDataURL();

        
        // console.log("fill end");
    }

    generateId = () => {
        // implementation taken from http://stackoverflow.com/a/2117523
        var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

        id = id.replace(/[xy]/g, (c) => {
            const r = Math.floor(Math.random() * 16);

            let v;
            if (c === 'x') {
                v = r;
            } else {
                v = (r & 0x3) | 0x8;
            }

            return v.toString(16);
        });

        return id;
    }

    uploadDrawing = () => {
        const {channelId, rootId} = this.props;
        const clientId = this.generateId();
        const blob = dataURItoFile(this.state.imageData);
        this.props.uploadFile(blob, 'drawing.png', channelId, rootId, clientId).then((data) => {
            this.props.createPost({
                channel_id: channelId,
                root_id: rootId,
                message: '',
                user_id: this.props.userId,
            }, data.body.file_infos);
            this.close();
        });
    }

    onDraw = (imageData, imageHistoryEntry) => {
        this.setState({
            imageData,
            history: [
                imageHistoryEntry,
                ...this.state.history.slice(),
            ],
            historyCursor: 0,
        });
    }

    redo = () => {
        const {history, historyCursor} = this.state;
        if (this.canRedo()) {
            const image = history[historyCursor - 1];
            this.paintRef.current.restoreImageHistory(image);
            const imageData = this.paintRef.current.restoreImageHistory(image);
            this.setState({
                imageData,
                historyCursor: historyCursor - 1,
            });
        }
    }

    undo = () => {
        const {history, historyCursor} = this.state;
        if (this.canUndo()) {
            const image = history[historyCursor + 1];
            const imageData = this.paintRef.current.restoreImageHistory(image);
            this.setState({
                imageData,
                historyCursor: historyCursor + 1,
            });
        }
    }

    canUndo = () => {
        const {history, historyCursor} = this.state;
        return history.length > (historyCursor + 1);
    }

    canRedo = () => {
        return this.state.historyCursor > 0;
    }

    close = () => {
        let width = 850;
        let height = 600;
        if (this.isSmall()) {
            width = window.innerWidth - 50;
            height = window.innerHeight - 250;
        }
        this.setState({
            brushColor: '#000000',
            lineWidth: 2,
            imageData: null,
            history: [
                {
                    img: null,
                    width,
                    height,
                },
            ],
            historyCursor: 0,
        });
        this.props.close();
    }

    render() {
        const {visible} = this.props;
        return (
            <Modal
                isOpen={visible}
                onRequestClose={this.close}
                className={this.isSmall() ? styles.modalSmall : styles.modal}
                style={customStyles}
            >
                <h4 className={styles.modalTitle}>
                    {'Upload drawing'}
                </h4>
                <i
                    onClick={this.close}
                    className={`icon icon-close ${styles.iconClose}`}
                    aria-label="Close Icon"
                />
                
                <div>
                    <CirclePicker
                        styles={{default: {card: {justifyContent: 'space-between'}}}}
                        color={this.state.brushColor}
                        onChangeComplete={this.setColor}
                        circleSize={20}
                        circleSpacing={0}
                        width={this.isSmall() ? window.innerWidth - 30 : 850}
                        colors={[
                            '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0',
                            '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
                            '#00bcd4', '#009688', '#4caf50', '#8bc34a',
                            '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
                            '#ff5722', '#795548',
                        ]}
                    />
                    {/*
                         <CustomSketchPicker
                        color={this.state.brushColor}
                        onChangeComplete={ (color)=>{ this.state.brushColor=color;} }
                        disableAlpha={true}
                        />
                    */}

                    <div className={styles.brushWidthContainer}>
                        <i
                            className='fa fa-undo'
                            onClick={this.undo}
                            style={{opacity: this.canUndo() ? 1 : 0.5}}
                        />
                        <i
                            className='fa fa-repeat'
                            style={{opacity: this.canRedo() ? 1 : 0.5}}
                            onClick={this.redo}
                        />
                        <input
                            type='file'
                            onChange={this.handleImage}
                            ref={this.inputFileRef}
                        />
                        <i
                            className='fa fa-picture-o'
                            onClick={() => this.inputFileRef.current.click()}
                        />
                        <span>{'Brush Width:'}</span>
                        <input
                            type='number'
                            value={this.state.lineWidth}
                            onChange={this.setLineWidth}
                            max={50}
                            min={1}
                            className={styles.number}
                        />
                        <input
                            type='range'
                            value={this.state.lineWidth}
                            onChange={this.setLineWidth}
                            max={50}
                            min={1}
                            className={styles.range}
                        />
                        <button
                            type='button'
                            className='btn'
                            onClick={this.fill}
                            >
                        {'Fill'}
                        </button>
                    </div>
                    <div className={this.isSmall() ? styles.paintContainerSmall : styles.paintContainer}>
                        <ReactPaint
                            ref={this.paintRef}
                            brushCol={this.state.brushColor.hex ? this.state.brushColor.hex : '#000000'}
                            lineWidth={this.state.lineWidth}
                            className='react-paint'
                            onDraw={this.onDraw}
                            initialWidth={this.isSmall() ? window.innerWidth - 50 : 850}
                            initialHeight={this.isSmall() ? window.innerHeight - 250 : 600}
                        />
                    </div>
                </div>
                <div className={styles.actions}>
                    <button
                        type='button'
                        className='btn btn-cancel'
                        onClick={this.close}
                    >
                        {'Cancel'}
                    </button>
                    <button
                        style={{marginLeft: 10}}
                        type='button'
                        className='btn btn-primary'
                        disabled={this.state.imageData === null}
                        onClick={this.uploadDrawing}
                    >
                        {'Upload'}
                    </button>
                </div>
            </Modal>
        );
    }
}
