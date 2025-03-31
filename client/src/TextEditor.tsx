import Quill, { Delta, EmitterSource } from 'quill';
import { useCallback, useEffect, useState} from 'react'
import "quill/dist/quill.snow.css";
import { io, Socket } from 'socket.io-client';
import { useParams } from 'react-router-dom';

export default function TextEditor() {
    const [socket, setSocket] = useState<Socket>();
    const [quill, setQuill] = useState<Quill>();
    const [intervalTime] = useState<number>(2000);
    const {id : documentId} = useParams();

    // For setting the connection with the backend...
    useEffect(()=>{
        const s = io(import.meta.env.VITE_BACKEND_URL)
        setSocket(s);     
        return ()=>{
            s.disconnect();
        }
    }, []);


    // For sending the changes in the quill editor to the backend so that it can send the changes back to the correct room.
    useEffect(()=>{
        if(!quill || !socket) return;
        const handler = (delta: Delta, source: EmitterSource)=>{
            if(source !== 'user') return;
            socket.emit('send-changes', delta);
        }
        quill.on('text-change', handler);
        return ()=>{
            quill.off('text-change', handler);
        }
    }, [quill, socket]);


    // For receiving the changes from the server and updating to the quill editor.
    useEffect(()=>{
        if(!socket || !quill) return ;
        const handler = (delta: Delta) => {
            quill.updateContents(delta);
        }
        socket.on('receive-changes', handler);
        return ()=>{
            socket.off('receive-changes', handler);
        }
    },[quill, socket]);

    // For setting the changes to the correct rooms.
    useEffect(()=>{
        if(!socket || !quill || !documentId) return ;
        socket.once('load-document', document => {
            quill.setContents(document);
            quill.enable();
        });
        socket.emit('get-document', documentId);
    }, [quill, socket, documentId]);


    // For saving the data to the db...
    useEffect(()=>{
        if(!socket || !quill) return ;
        const intervalId = setInterval(()=>{
            socket.emit('save-changes', quill.getContents());
        }, intervalTime);
        return ()=>{
            clearInterval(intervalId);
        }
    }, [socket, quill]);

    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        ['link', 'image', 'video', 'formula'],
      
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction
      
        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],
      
        ['clean']                                         // remove formatting button
      ];
    type wrapperType = { innerHTML: string; append: (arg0: HTMLDivElement) => void; } | null
    
    const wrapperRef = useCallback((wrapper: wrapperType) => {
        if(wrapper == null) return ;
        wrapper.innerHTML = '';
        const editorDiv = document.createElement('div');
        wrapper.append(editorDiv);
        const q = new Quill(editorDiv, {
            modules: {
                toolbar: toolbarOptions
            },
            theme: 'snow'
        });
        q.disable();
        q.setText("Loading...")
        setQuill(q);

    }, []);
    return (
        <div className='container' ref={wrapperRef}>
        </div>
    )
}

