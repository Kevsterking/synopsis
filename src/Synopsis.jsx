import { toHaveDisplayValue } from '@testing-library/jest-dom/matchers';
import React from 'react';

function Synopsis() {
  return (new Diagram()).render();
}

function DiagramGrid() {

  this.init = (root) => {

    this.element = root;

    this.context = this.element.getContext("2d");
    this.context.canvas.width = this.element.offsetWidth;
    this.context.canvas.height = this.element.offsetHeight;
  
    this.origin = { x: 0, y: 0 };
  
    this.setTranslation = (x, y) => {
      this.origin.x = this.context.canvas.width * 0.5 + x;
      this.origin.y = this.context.canvas.height * 0.5 + y;
    }

    this.update = () => {

      /*
        Clear the canvas before drawing new gridlines
      */ 
      this.context.clearRect(0, 0, this.element.offsetWidth, this.element.offsetHeight);
  
      this.context.translate(0.5, 0.5); // This is fucking bizzarre but it works (straddling)
  
      /* Draw full gridlines */ 
      this.context.beginPath();
      this.context.strokeStyle = "rgb(55, 55, 55)";
      for (let x = this.origin.x % 100 - 50; x < this.element.offsetWidth; x += 100) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, this.element.offsetHeight);
      }
      for (let y = this.origin.y % 100 - 50; y < this.element.offsetWidth; y += 100) {
        this.context.moveTo(0, y);
        this.context.lineTo(this.element.offsetWidth, y);
      }
      this.context.closePath();
      this.context.stroke();
  
      /* Draw half gridlines */ 
      this.context.beginPath();
      this.context.strokeStyle = "rgb(60, 60, 60)";
      for (let x = this.origin.x % 100; x < this.element.offsetWidth; x += 100) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, this.element.offsetHeight);
      }
      for (let y = this.origin.y % 100; y < this.element.offsetWidth; y += 100) {
        this.context.moveTo(0, y);
        this.context.lineTo(this.element.offsetWidth, y);
      }
      this.context.closePath();
      this.context.stroke();    
  
      this.context.translate(-0.5, -0.5);
  
    }

  }

  this.render = () => {
    return (
      <canvas className="diagram-canvas" style={{ zIndex: "1", position: "absolute", width: "100%", height: "100%" }}>
      </canvas>
    );
  }

}

function DiagramNode(x, y) {

  this.x = x;
  this.y = y;

  this.render = () => {
    return (
      <div style={{position: "absolute", boxShadow: "rgba(0, 0, 0, 0.2) 0px 60px 40px -7px", backgroundColor: "rgba(140, 140, 140)", cursor: "pointer", padding: "15px", color: "white", left: this.x, top: this.y }}>
        HELLO WORLD!
      </div>
    ); 
  }

}

function DiagramContent() {

  this.nodes    = [];
  this.setNodes = null;

  this.init = (root) => {

    this.element = root;
    this.translator_element = root.querySelector(".diagram-nodes-translator");

    this.extent = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };

    /*
      Expand if necessary to contain all placed elements
    */
    this.place = (x, y) => {

      const newNode = new DiagramNode(x, y);

      this.nodes.push(newNode);
      this.setNodes(this.nodes);

      if (x > this.extent.x.max) this.extent.x.max = x;
      else if (x < this.extent.x.min) this.extent.x.min = x;
      if (y > this.extent.y.max) this.extent.y.max = y;
      else if (y < this.extent.y.min) this.extent.y.min = y;

      this.translator_element.style.transform = "translate(" + (-this.extent.x.min) + "px, " + (-this.extent.y.min) + "px)";

      this.element.style.width = (this.extent.x.max - this.extent.x.min) + "px";
      this.element.style.height = (this.extent.y.max - this.extent.y.min) + "px";
      
    }


  }

  this.render = () => {

    const [nodes, setNodes] = React.useState([]);
    
    this.setNodes = () => {
      setNodes(this.nodes.map((node) => node.render()));
    };

    return (
      <div className="diagram-nodes" style={{ border: "1px solid white" }}>
        <div className="diagram-nodes-translator">
          { nodes }
        </div>
      </div>
    );

  }


}

function Diagram() {
  
  this.id = React.useId();
  
  this.content    = new DiagramContent();
  this.background = new DiagramGrid(); 

  /*
    Perform certain action as the component mounts
  */
  const onload = () => {

    console.log("window load");

    this.element = document.getElementById(this.id);
    this.dynamic_foreground = this.element.querySelector(".diagram-dynamic-foreground");
    this.content_container = this.element.querySelector(".diagram-content-container");

    this.content.init(this.element.querySelector(".diagram-content-container > *"));
    this.background.init(this.element.querySelector(".diagram-static-background > *"));

    /*
      Update state of diagram
    */
    this.update = () => {

      const x = (this.dynamic_foreground.scrollWidth - this.dynamic_foreground.offsetWidth) * 0.5 - this.dynamic_foreground.scrollLeft;
      const y = (this.dynamic_foreground.scrollHeight - this.dynamic_foreground.offsetHeight) * 0.5 - this.dynamic_foreground.scrollTop;
  
      /* Keep scrollbar size updated */
      this.content_container.style.padding = (this.dynamic_foreground.clientHeight - 100) + "px " + (this.dynamic_foreground.clientWidth - 100) + "px";

      /* Update background translation */
      this.background.setTranslation(x - this.content.element.offsetWidth * 0.5 - this.content.extent.x.min, y - this.content.element.offsetHeight * 0.5 - this.content.extent.y.min)
  
      /* Update background */
      this.background.update();
  
    }

    /*
      Translate the panzoom area to (x, y) 
    */
    this.setTranslation = (x, y) => {
      this.dynamic_foreground.scrollLeft = (this.dynamic_foreground.scrollWidth - this.dynamic_foreground.offsetWidth) * 0.5 - x;
      this.dynamic_foreground.scrollTop = (this.dynamic_foreground.scrollHeight - this.dynamic_foreground.offsetHeight) * 0.5 - y;
      this.update();
    }

    /*
      Handle right clicks
    */
    this.content_container.oncontextmenu = (e) => {
      e.preventDefault();
      let poffs = { x: this.content.extent.x.min, y: this.content.extent.y.min };
      this.content.place(e.layerX - this.dynamic_foreground.clientWidth + 100 + this.content.extent.x.min, e.layerY - this.dynamic_foreground.clientHeight + 100 + this.content.extent.y.min);
      this.dynamic_foreground.scrollLeft -= (this.content.extent.x.min - poffs.x);
      this.dynamic_foreground.scrollTop -= (this.content.extent.y.min - poffs.y);
      this.update();
    }

    this.dynamic_foreground.onscroll = this.update;
  
    this.update();
    this.setTranslation(0, 0);

  }

  window.onload = onload;

  this.render = () => {

    return (
      <div className="diagram-root" id={this.id} style={{ zIndex: "0", position: "relative", display: "inline-block", overflow: "hidden", width: "1500px", height: "900px", backgroundColor: "rgb(51, 51, 51)" }}>
      
        <div className="diagram-static-background" style={{ zIndex: "1", position: "absolute", top: "0", left: "0", right: "0", bottom: "0" }}>
        
          {this.background.render()}
        
        </div>
      
        <div className="diagram-dynamic-foreground" style={{ zIndex: "100", overflow: "scroll", position: "absolute", top: "0", left: "0", right: "0", bottom: "0" }}>
          
          <div className="diagram-content-container" style={{ position: "relative", float: "left" }}>
            
            {this.content.render()}
          
          </div>

        </div>

      </div>
    );
      
  }

}

export default Synopsis;
