import {LitElement, html, css, PropertyValues} from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import {unsafeHTML} from 'lit/directives/unsafe-html.js'
import '@material/mwc-snackbar'
import '@material/mwc-button'
import '@material/mwc-tab-bar'
import '@material/mwc-textarea'
import '@material/mwc-slider'
import {TextArea} from "@material/mwc-textarea";
import {hasJapanese} from 'asian-regexps'
import html2canvas from 'html2canvas'
import {Slider} from "@material/mwc-slider";
import 'vanilla-colorful'
// import '@material/mwc-icon-button'
// import '@material/mwc-dialog'
// import '@material/mwc-textfield'
// import '@material/mwc-checkbox'

declare global {
  interface Window {
    app: AppContainer;
    toast: (labelText: string, timeoutMs?: number) => void;
  }
}

const views = ['text', 'size', 'back', 'front', 'save'] as const
declare type View = typeof views[number]

@customElement('app-container')
export class AppContainer extends LitElement {

  @state() view: View = 'text';
  @state() text = 'ある'
  @state() size = 50
  @state() backColor = '#000000'
  @state() frontColor = '#ffffff'

  @query('#canvas') canvasElement!: HTMLDivElement;
  @query('mwc-textarea') textarea!: TextArea;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
    }
    #canvas {
      width: 100%;
      max-width: 640px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    #canvas > span {
      white-space: pre-line;
    }

    #controls {
      width: 100%;
      flex: 1;
      //overflow: hidden;
    }
    .control-box {
      display: none;
    }
    .control-box[selected] {
      display: flex;
      height: 100%;
    }

    :host([lang=japanese]) #canvas > span {
      font-family: 'Noto Serif JP', serif;
      position: relative;
      top: -16px;
    }

    hex-color-picker {
      width: 100%;
      height: 100%;
      padding: 12px;
      box-sizing: border-box;
    }
  `

  render () {
    if (hasJapanese(this.text)) {
      this.setAttribute('lang', 'japanese')
    }
    else {
      this.removeAttribute('lang')
    }

    return html`
        <style>
            #canvas {
                background-color: ${this.backColor};
                color: ${this.frontColor};
            }
            #canvas > span {
                font-size: ${this.size}px;
            }
        </style>


        <div id="canvas"><span>${unsafeHTML(this.text)}</span></div>
        <mwc-tab-bar activeIndex=${views.indexOf(this.view)} style="width: 100%   "
            @MDCTabBar:activated="${e=> {this.onMDCTabBarActivate(e)}}">
            <mwc-tab icon="text_format"></mwc-tab>
            <mwc-tab icon="format_size"></mwc-tab>
            <mwc-tab icon="flip_to_back"></mwc-tab>
            <mwc-tab icon="flip_to_front"></mwc-tab>
            <mwc-tab icon="save"></mwc-tab>
        </mwc-tab-bar>


        <div id="controls">
            <div class="control-box" ?selected="${this.view == 'text'}">
                <mwc-textarea style="width:100%;height:100%"
                    @keyup="${()=>this.text=this.textarea.value}" value="${this.text}"></mwc-textarea>
            </div>
            <div class="control-box" ?selected="${this.view == 'size'}">
                <mwc-slider
                        discrete
                        min="12"
                        max="500"
                        step="1"
                        value="${this.size}"
                        @input="${e=> this.size=e.detail.value}"
                        style="margin: 48px 0;width:100%"
                ></mwc-slider>
            </div>
            <div class="control-box" ?selected="${this.view == 'back'}">
                <hex-color-picker
                        .color="${this.backColor}"
                        @color-changed="${e=> this.backColor=e.detail.value}"
                        style="width:100%;height:100%;"
                ></hex-color-picker>
            </div>
            <div class="control-box" ?selected="${this.view == 'front'}">
                <hex-color-picker
                        .color="${this.frontColor}"
                        @color-changed="${e=> this.frontColor=e.detail.value}"
                        style="width:100%;height:100%;"
                ></hex-color-picker>
            </div>
            <div class="control-box" ?selected="${this.view == 'save'}" style="justify-content: center;align-items: center">
                <mwc-button raised
                    @click=${()=>{this.save()}}>save</mwc-button>
            </div>
        </div>
    `
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    window.addEventListener('resize', this.onResize.bind(this))
    super.firstUpdated(_changedProperties);
  }

  protected updated(_changedProperties: PropertyValues) {
    this.onResize()
    super.updated(_changedProperties);
  }

  async onMDCTabBarActivate (e) {
    this.view=views[e.detail.index]
    await this.requestUpdate()
    if (views[e.detail.index]=='size') {
      ;(this.shadowRoot!.querySelector('mwc-slider') as Slider).layout()
    }
  }

  onResize () {
    const canvasStyles = window.getComputedStyle(this.canvasElement)
    this.canvasElement.style.height = `${~~parseInt(canvasStyles.width)}px`
  }

  async save() {
    // we floor the dimensions to avoid html2canvas glitch on the sides
    const canvasStyles = window.getComputedStyle(this.canvasElement)
    this.canvasElement.style.height = `${~~parseInt(canvasStyles.width)}px`
    this.canvasElement.style.width = `${~~parseInt(canvasStyles.width)}px`

    // snapshot
    const canvas = await html2canvas(this.canvasElement);
    // const dataURL = canvas.toDataURL()
    const img = document.createElement('a')
    img.href = canvas.toDataURL()
    img.download = `instagram-img-${Date.now()}`
    img.click()
    // console.log(canvas.toDataURL())

    // finally we remove the width property off the canvas element to avoid inconsistent resizing
    this.canvasElement.style.width = ''
  }
}
