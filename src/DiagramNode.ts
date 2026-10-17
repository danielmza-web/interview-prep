import {Node as TiptapNode} from '@tiptap/react';
import {isDiagramId,diagramHTML,diagrams} from './diagrams';
export const DiagramNode=TiptapNode.create({
 name:'studyDiagram',group:'block',atom:true,selectable:true,draggable:false,
 addAttributes(){return {diagramId:{default:null}};},
 parseHTML(){return [{tag:'div[data-study-diagram]',getAttrs:el=>{const id=(el as HTMLElement).getAttribute('data-study-diagram');return isDiagramId(id)?{diagramId:id}:false;}}];},
 renderHTML({node}){const id=node.attrs.diagramId;return isDiagramId(id)?['div',{'data-study-diagram':id},['p',{},diagrams[id].title+'. '+diagrams[id].description]]:['p',{},'Diagram unavailable.'];},
 addNodeView(){return ({node})=>{const dom=document.createElement('div');dom.contentEditable='false';const id=node.attrs.diagramId;if(isDiagramId(id))dom.innerHTML=diagramHTML(id);return {dom};};}
});
