// tldraw-element.js
import { Editor, Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { createRoot, type Root } from 'react-dom/client'
import React from 'react'

export class TldrawElement extends HTMLElement {
  public editor:Editor|null = null
  public _root:Root | null = null
  connectedCallback() {
    // 创建一个 Shadow Root 以隔离样式（可选）
    const mountPoint = document.createElement('div')
    mountPoint.style.height = '100%'
    mountPoint.style.width = '100%'
    this.appendChild(mountPoint)

    const root = createRoot(mountPoint)
    // 渲染 tldraw 组件
    root.render(
      React.createElement(Tldraw, {
        options:{
          maxPages: 1
        },
        components:{
          PageMenu: null,  // 隐藏页码 UI
          MainMenu: null,  // 隐藏左上角的主菜单
        },
        // 你可以在这里通过属性传递配置
        persistenceKey: this.getAttribute('persistence-key') || 'tldraw-example',
        licenseKey:'tldraw-2026-05-31/WyJoYXp6WVMwSiIsWyIqIl0sMTYsIjIwMjYtMDUtMzEiXQ.g2USTQJBbXguiS1ngfMzE4VmmyXLVWQEMgDm7BC6qZUkwMezzZWUQs9tQMmhPFBNpcXAAbKWN8alH9Tqyakpqg',
        onMount: (editor) => {
          // 将编辑器实例暴露给外部 JS
          this.editor = editor
          // 触发一个自定义事件告知外部：编辑器已就绪
          this.dispatchEvent(new CustomEvent('ready', { detail: editor }))
        }
      })
    )
    this._root = root
  }

  disconnectedCallback() {
    this._root?.unmount()
  }
  // --- 方法 1: 导出图片 Blob ---
  async exportImage() {
    if (!this.editor) return null;
    
    // 获取当前页面所有的形状 ID
    const shapeIds = Array.from(this.editor.getCurrentPageShapeIds())
    
    if (shapeIds.length === 0) {
      console.warn("画布为空，无法导出");
      return null;
    }

    // 使用 tldraw 提供的工具函数导出
    const blob = await this.editor?.toImage(
      shapeIds,
      {
        format:'webp',
        background:true,
        padding:10,
      }
    )
    
    return blob;
  }

  // --- 方法 2: 清除画布内容 ---
  clearCanvas() {
    if (!this.editor) return;
    
    // 选中所有形状并删除
    const shapeIds = Array.from(this.editor.getCurrentPageShapeIds())
    this.editor.deleteShapes(shapeIds)
    
    // 或者如果你想重置整个存储空间（包括撤销历史）：
    // this.editor.store.clear() 
  }
}

 

// 注册自定义标签 <web-tldraw>
customElements.define('web-tldraw', TldrawElement)