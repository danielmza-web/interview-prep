import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {TableKit} from '@tiptap/extension-table';
import {useEffect} from 'react';
import {safe} from './safe';
import {DiagramNode} from './DiagramNode';
export function Editor({value,onChange,label}:{value:string;onChange:(v:string)=>void;label:string}){
 const editor=useEditor({immediatelyRender:false,extensions:[StarterKit.configure({link:{openOnClick:false,HTMLAttributes:{rel:'noopener noreferrer'}}}),TableKit,DiagramNode],content:safe(value),editorProps:{attributes:{class:'prose editor-content','aria-label':label,role:'textbox','aria-multiline':'true'}},onUpdate:({editor})=>{if(!editor.isDestroyed)onChange(editor.getHTML());}});
 useEffect(()=>{if(editor && !editor.isDestroyed && editor.getHTML()!==safe(value) && !editor.isFocused)editor.commands.setContent(safe(value),{emitUpdate:false});},[value,editor]);
 if(!editor)return null;
 return <div className="editor"><div className="editor-tools" role="toolbar" aria-label="Text formatting">{[
 ['Bold',()=>editor.chain().focus().toggleBold().run()],['Italic',()=>editor.chain().focus().toggleItalic().run()],['Heading',()=>editor.chain().focus().toggleHeading({level:3}).run()],['Bullets',()=>editor.chain().focus().toggleBulletList().run()],['Numbered',()=>editor.chain().focus().toggleOrderedList().run()],['Link',()=>{const href=prompt('Link address (https://… or #section-id)',editor.getAttributes('link').href||'');if(href===null)return;if(!href)editor.chain().focus().unsetLink().run();else if(/^(https?:\/\/|#)/i.test(href))editor.chain().focus().setLink({href}).run();}],['Table',()=>editor.chain().focus().insertTable({rows:3,cols:2,withHeaderRow:true}).run()],['Add row',()=>editor.chain().focus().addRowAfter().run()],['Add column',()=>editor.chain().focus().addColumnAfter().run()],['Remove table',()=>editor.chain().focus().deleteTable().run()],['Undo',()=>editor.chain().focus().undo().run()],['Redo',()=>editor.chain().focus().redo().run()]
 ].map(([name,action])=><button key={String(name)} type="button" onClick={action as ()=>void}>{String(name)}</button>)}</div><EditorContent editor={editor}/></div>;
}
