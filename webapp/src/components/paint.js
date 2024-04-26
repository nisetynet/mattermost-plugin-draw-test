import React, {Component} from 'react';
import PropTypes from 'prop-types';

import styles from './paint.css';

export default class ReactPaint extends Component {
    static propTypes = {
        className: PropTypes.string,
        brushCol: PropTypes.string,
        lineWidth: PropTypes.number,
        onDraw: PropTypes.func,
        initialWidth: PropTypes.number,
        initialHeight: PropTypes.number,
    };
    static defaultProps = {
        className: 'react-paint',
        brushCol: '#ff6347',
        onDraw: () => null,
    };

    constructor(...props) {
        super(...props);

        this.state = {
            mouseDown: false,
            mouseLoc: [0, 0],
            width: this.props.initialWidth,
            height: this.props.initialHeight,
        };
        this.canvas = React.createRef();
    }

    getContext = () => {
        const {brushCol, lineWidth} = this.props;

        const context = this.canvas.current.getContext('2d');
        context.lineWidth = lineWidth;
        context.strokeStyle = brushCol;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        return context;
    }

    getBB = () => this.canvas.current.getBoundingClientRect();

    setImage(image) {
        this.setState({width: image.width, height: image.height});
        const context = this.getContext();
        context.drawImage(image, 0, 0);
        this.onDraw();
    }

    mouseDown = (e) => {
        const context = this.getContext();
        if (!this.state.mouseDown) {
            this.setState({mouseDown: true});
            context.beginPath();
        }

        this.setState({
            mouseLoc: [e.pageX || e.touches[0].pageX, e.pageY || e.touches[0].pageY],
        });

        const bb = this.getBB();
        context.moveTo(
            (e.pageX || e.touches[0].pageX) - bb.left,
            (e.pageY || e.touches[0].pageY) - bb.top
        );
    }

    mouseUp = () => {
        this.setState({mouseDown: false});
        const context = this.getContext();
        context.closePath();
    }

    mouseMove = (e) => {
        if (this.state.mouseDown) {
            // prevent IOS scroll when drawing
            if (e.touches) {
                e.preventDefault();
            }

            const bb = this.getBB();
            if (
                (e.pageX || e.touches[0].pageX) > bb.left &&
                (e.pageY || e.touches[0].pageY) < (bb.top + this.canvas.current.height)
            ) {
                const context = this.getContext();
                context.lineTo(
                    ((e.pageX || e.touches[0].pageX) - bb.left),
                    ((e.pageY || e.touches[0].pageY) - bb.top)
                );

                context.stroke();
            }
        }
    }

    restoreImageHistory(image) {
        const context = this.getContext();
        this.setState({width: image.width, height: image.height});
        if (image.img === null) {
            context.clearRect(0, 0, image.width, image.height);
        } else {
            context.putImageData(image.img, 0, 0);
        }
        return this.canvas.current.toDataURL();
    }

    onDraw = () => {
        const context = this.getContext();
        // console.log("draw color: " + JSON.stringify(this.props.brushCol));
        
        this.props.onDraw(
            this.canvas.current.toDataURL(),
            {
                img: context.getImageData(0, 0, this.state.width, this.state.height),
                width: this.state.width,
                height: this.state.height,
            }
        );
    }

    render() {
        const {className} = this.props;

        return (
            <div className={className}>
                <canvas
                    ref={this.canvas}
                    className={`${className}__canvas ` + styles.canvas}

                    width={this.state.width}
                    height={this.state.height}

                    onClick={this.onDraw}

                    style={{
                        width: this.state.width,
                        height: this.state.height,
                        cursor: 'crosshair',
                    }}

                    onMouseDown={this.mouseDown}
                    onTouchStart={this.mouseDown}

                    onMouseUp={this.mouseUp}
                    onTouchEnd={this.mouseUp}

                    onMouseMove={this.mouseMove}
                    onTouchMove={this.mouseMove}
                />
            </div>
        );
    }
}
