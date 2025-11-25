import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslations } from '../contexts/i18n';

type Command = 'bold' | 'italic' | 'underline' | 'insertOrderedList' | 'insertUnorderedList' | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'unlink';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
    command?: Command,
    icon: React.ReactNode,
    title: string,
    isActive: boolean,
    onClick?: (e: React.MouseEvent) => void,
    disabled?: boolean,
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ command, icon, title, isActive, onClick, disabled }) => {
    const execute = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onClick) {
            onClick(e);
            return;
        }
        if (command) {
            document.execCommand(command, false);
        }
    };
    return (
        <button
            onMouseDown={execute}
            title={title}
            disabled={disabled}
            className={`p-2 rounded transition-colors w-9 h-9 flex items-center justify-center ${isActive ? 'bg-gray-300' : 'hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {icon}
        </button>
    );
};

const commandsWithState: Command[] = ['bold', 'italic', 'underline', 'insertOrderedList', 'insertUnorderedList', 'justifyLeft', 'justifyCenter', 'justifyRight'];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslations();
    const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
    const [currentBlockTag, setCurrentBlockTag] = useState('p');

    useEffect(() => {
        const editor = editorRef.current;
        if (editor && editor.innerHTML !== value) {
            editor.innerHTML = value;
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const updateToolbarState = useCallback(() => {
        const newActiveCommands = new Set<string>();
        for (const cmd of commandsWithState) {
            if (document.queryCommandState(cmd)) {
                newActiveCommands.add(cmd);
            }
        }
        
        // Check for link state
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            let parentNode = selection.getRangeAt(0).startContainer;
             if (parentNode.nodeType !== Node.ELEMENT_NODE) {
                parentNode = parentNode.parentNode!;
            }
            if (parentNode && (parentNode as HTMLElement).closest('a')) {
                 newActiveCommands.add('unlink');
            }
        }
        
        // Check for block tag state
        let blockTag = document.queryCommandValue('formatBlock').toLowerCase();
        if (['div', 'p', ''].includes(blockTag)) {
            blockTag = 'p';
        }
        setCurrentBlockTag(blockTag);

        setActiveCommands(newActiveCommands);
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleSelectionChange = () => {
            if (document.activeElement === editor || editor.contains(document.activeElement)) {
                updateToolbarState();
            }
        };

        // Listen for selection changes to update the toolbar
        document.addEventListener('selectionchange', handleSelectionChange);
        editor.addEventListener('focus', updateToolbarState);
        editor.addEventListener('click', updateToolbarState);
        editor.addEventListener('keyup', updateToolbarState);


        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            editor.removeEventListener('focus', updateToolbarState);
            editor.removeEventListener('click', updateToolbarState);
            editor.removeEventListener('keyup', updateToolbarState);
        };
    }, [updateToolbarState]);
    
    const handleFormatBlock = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tag = e.target.value;
        document.execCommand('formatBlock', false, `<${tag}>`);
    };

    const handleLink = () => {
        const url = prompt(t.richTextEditor.linkPrompt);
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };
    
    const handleImage = () => {
        const url = prompt(t.richTextEditor.imagePrompt);
        if (url) {
            document.execCommand('insertImage', false, url);
        }
    };

    return (
        <div className="border border-gray-300 rounded-lg shadow-sm">
            <div className="flex items-center p-2 border-b bg-gray-50 rounded-t-lg flex-wrap gap-1">
                <select value={currentBlockTag} onChange={handleFormatBlock} className="p-1.5 border border-gray-300 rounded bg-white text-sm focus:ring-1 focus:ring-viniela-gold focus:border-viniela-gold">
                    <option value="p">{t.richTextEditor.paragraph}</option>
                    <option value="h2">{t.richTextEditor.heading2}</option>
                    <option value="h3">{t.richTextEditor.heading3}</option>
                </select>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <ToolbarButton title={t.richTextEditor.bold} command="bold" icon={<i className="fa-solid fa-bold" />} isActive={activeCommands.has('bold')} />
                <ToolbarButton title={t.richTextEditor.italic} command="italic" icon={<i className="fa-solid fa-italic" />} isActive={activeCommands.has('italic')} />
                <ToolbarButton title={t.richTextEditor.underline} command="underline" icon={<i className="fa-solid fa-underline" />} isActive={activeCommands.has('underline')} />
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <ToolbarButton title={t.richTextEditor.addLink} onClick={handleLink} icon={<i className="fa-solid fa-link" />} isActive={false} />
                <ToolbarButton title={t.richTextEditor.removeLink} command="unlink" icon={<i className="fa-solid fa-link-slash" />} isActive={activeCommands.has('unlink')} disabled={!activeCommands.has('unlink')} />
                <ToolbarButton title={t.richTextEditor.insertImage} onClick={handleImage} icon={<i className="fa-solid fa-image" />} isActive={false} />
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <ToolbarButton title={t.richTextEditor.alignLeft} command="justifyLeft" icon={<i className="fa-solid fa-align-left" />} isActive={activeCommands.has('justifyLeft')} />
                <ToolbarButton title={t.richTextEditor.alignCenter} command="justifyCenter" icon={<i className="fa-solid fa-align-center" />} isActive={activeCommands.has('justifyCenter')} />
                <ToolbarButton title={t.richTextEditor.alignRight} command="justifyRight" icon={<i className="fa-solid fa-align-right" />} isActive={activeCommands.has('justifyRight')} />
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <ToolbarButton title={t.richTextEditor.orderedList} command="insertOrderedList" icon={<i className="fa-solid fa-list-ol" />} isActive={activeCommands.has('insertOrderedList')} />
                <ToolbarButton title={t.richTextEditor.unorderedList} command="insertUnorderedList" icon={<i className="fa-solid fa-list-ul" />} isActive={activeCommands.has('insertUnorderedList')} />
            </div>
            <div
                ref={editorRef}
                onInput={handleInput}
                contentEditable
                className="prose max-w-none p-3 min-h-[120px] focus:outline-none prose-h2:text-2xl prose-h3:text-xl"
                data-placeholder={placeholder}
            ></div>
             <style>{`
                [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                .prose img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                }
             `}</style>
        </div>
    );
};

export default RichTextEditor;