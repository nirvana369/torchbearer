type EditCommunicatorToParentMessage =
    | {
          type: 'element-selection';
          payload: {
              selectedElements: Array<{ id: string; tagName: string; domTreeString: string }>;
              selectedElementIds: string[];
              elementId: string;
              elementTree: string;
          };
      }
    | {
          type: 'status';
          payload: { status: string };
      }
    | {
          type: 'ack';
          payload: { message: ParentToEditCommunicatorMessage };
      }
    | {
          type: 'selection-rebuilt';
          payload: {
              selectedElements: Array<{ id: string; domTreeString: string }>;
              selectedElementIds: string[];
          };
      }
    | {
          type: 'error';
          payload: { msg: string };
      };

type ParentToEditCommunicatorMessage =
    | {
          type: 'ready';
          payload?: undefined;
      }
    | {
          type: 'tool-element-selection';
          payload?: undefined;
      }
    | {
          type: 'clear-selection';
          payload?: undefined;
      }
    | {
          type: 'remove-selection';
          payload: { element: string };
      }
    | {
          type: 'rebuild-selection';
          payload: { ids: string[] };
      };

const EditorStates = {
    Initializing: {
        type: 'initializing' as const
    },
    Ready: {
        type: 'ready' as const
    },
    ElementSelection: {
        type: 'element-selection' as const,
        selectedElements: null as Element | null
    }
} as const;

const allowedOrigins = ['http://localhost:3000', 'https://dev.caffeine.ai', 'https://caffeine.ai'];
let parentOrigin: string | null = null;

type EditorState = (typeof EditorStates)[keyof typeof EditorStates];

function hashDomTreeString(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    }

    return 'id-' + (hash >>> 0).toString(36).padStart(6, '0');
}

function ensurePositionedForBadge(el: HTMLElement): void {
    const style = window.getComputedStyle(el);
    if (style.position === 'static') {
        el.classList.add('editor-selected-badged');
    }
}

function addBadge(el: HTMLElement, id: string): void {
    ensurePositionedForBadge(el);
    const badge = document.createElement('span');
    badge.className = 'editor-badge';
    badge.textContent = id;
    badge.setAttribute('data-editor-badge', '1');
    el.appendChild(badge);
}

function removeBadge(el: HTMLElement): void {
    const badge = el.querySelector('[data-editor-badge="1"]');
    if (badge) badge.remove();
    el.classList.remove('editor-selected-badged');
}

function clearBadges(): void {
    const badges = document.querySelectorAll<HTMLElement>('[data-editor-badge="1"]');
    badges.forEach((badge) => {
        const parent = badge.parentElement as HTMLElement | null;
        badge.remove();
        if (parent) {
            parent.classList.remove('editor-selected-badged');
        }
    });
}

/**
 * Coordinates editor tooling inside the generated app and
 * synchronizes state with the parent frame via `postMessage`.
 *
 * PostMessage protocol:
 * - Parent → editor (`ParentToEditCommunicatorMessage.type`)
 *   - `ready`: Reset selections and emit current status.
 *   - `tool-element-selection`: Enter selection mode (adds crosshair cursor, clears
 *     existing selections) and report status.
 *   - `clear-selection`: Remove every selected element.
 *   - `remove-selection`: Remove a single selection (`payload.element` is the id).
 *   - `rebuild-selection`: Attempt to recreate selections from `payload.ids`.
 * - Editor → parent (`EditCommunicatorToParentMessage.type`)
 *   - `ack`: Echo every incoming message for handshake/debugging (`payload.message`).
 *   - `status`: Report lifecycle transitions such as `initializing`, `ready`,
 *     `element-selection`, or textual statuses like `clearing selections`.
 *   - `element-selection`: Sent after every click; includes
 *     `{ selectedElements, selectedElementIds, elementId, elementTree }`.
 *   - `selection-rebuilt`: Sent after processing `rebuild-selection` with the matched ids.
 *
 * The class also injects highlighting styles, tracks the current editor state, and
 * manages hover/click listeners so the parent application can drive a visual DOM picker.
 */
export class EditCommunicator {
    #toParent(message: EditCommunicatorToParentMessage) {
        if (!parentOrigin) {
            return;
        }

        parent.postMessage(message, parentOrigin);
    }

    #editorState: EditorState = {
        type: 'initializing'
    };

    #selectedElements: Map<string, { id: string; element: HTMLElement; domTreeString: string }> = new Map();

    #boundMouseOverListener: (event: MouseEvent) => void = this.#handleMouseOver.bind(this);
    #boundMouseOutListener: (event: MouseEvent) => void = this.#handleMouseOut.bind(this);

    #injectEditorStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .editor-selected {
                outline: 2px solid #4D99F0 !important;
                outline-offset: 2px !important;
                /* Override visibility properties that could hide the outline */
                opacity: 1 !important;
                visibility: visible !important;
                /* Disable transitions that could affect outline visibility */
                transition: none !important;
                transition-property: none !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                /* Ensure outline is not clipped by clip-path or clip */
                clip-path: none !important;
                clip: unset !important;
            }

            .editor-hover {
                outline: 1px dashed #4D99F0 !important;
                outline-offset: 2px !important;
            }

            .editor-selected-badged {
                position: relative !important;
            }
            .editor-badge {
                position: absolute !important;
                top: 0 !important;
                right: 0 !important;
                background: #4D99F0 !important;
                color: #fff !important;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                font-size: 11px !important;
                line-height: 1 !important;
                padding: 4px 6px !important;
                border-radius: 10px !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
                z-index: 2147483647 !important;
                pointer-events: none !important;
                user-select: none !important;
            }

            .editor-element-selection-mode {
                cursor: crosshair !important;
            }
            .editor-element-selection-mode * {
                cursor: crosshair !important;
            }

        `;
        document.head.appendChild(style);
    }

    #clearAllSelections(): void {
        const allElements = document.querySelectorAll('.editor-selected');
        allElements.forEach((element) => {
            element.classList.remove('editor-selected');
        });
        this.#selectedElements.clear();
        clearBadges();
    }

    #removeSelection(id: string): void {
        const entry = this.#selectedElements.get(id);
        if (entry) {
            entry.element.classList.remove('editor-selected');
            removeBadge(entry.element);
            this.#selectedElements.delete(id);
            return;
        }
    }

    #addSelection(id: string, target: HTMLElement, domTreeString: string): void {
        target.classList.add('editor-selected');
        addBadge(target, id);
        this.#selectedElements.set(id, { id, element: target, domTreeString });
    }

    #toggleCrosshairCursor(enabled: boolean): void {
        if (enabled) {
            document.body.classList.add('editor-element-selection-mode');
        } else {
            document.body.classList.remove('editor-element-selection-mode');
        }
    }

    #generateDOMTreeString(element: HTMLElement): string {
        const path: HTMLElement[] = [];
        let current: HTMLElement | null = element;

        while (current && current !== document.body) {
            path.unshift(current);
            current = current.parentElement;
        }

        const bodyElement = document.body;
        if (!bodyElement) {
            return element.outerHTML;
        }

        const buildTree = (parent: HTMLElement, remainingPath: HTMLElement[]): HTMLElement => {
            const clonedParent = parent.cloneNode(false) as HTMLElement;

            Array.from(parent.children).forEach((child) => {
                const childElement = child as HTMLElement;

                if (remainingPath.length > 0 && childElement === remainingPath[0]) {
                    if (remainingPath.length === 1) {
                        const clonedChild = childElement.cloneNode(true) as HTMLElement;
                        this.#removeArtificialElements(clonedChild);
                        clonedChild.setAttribute('data-target', 'this');
                        clonedParent.appendChild(clonedChild);
                    } else {
                        const clonedChild = buildTree(childElement, remainingPath.slice(1));
                        clonedParent.appendChild(clonedChild);
                    }
                } else {
                    const clonedChild = childElement.cloneNode(true) as HTMLElement;
                    this.#removeArtificialElements(clonedChild);
                    clonedParent.appendChild(clonedChild);
                }
            });

            this.#removeArtificialElements(clonedParent);
            return clonedParent;
        };

        const tree = buildTree(bodyElement, path);
        return tree.outerHTML;
    }

    #removeArtificialElements(element: HTMLElement): void {
        const badges = element.querySelectorAll('[data-editor-badge="1"]');
        badges.forEach((badge) => badge.remove());

        element.classList.remove('editor-selected', 'editor-selected-badged', 'editor-hover');

        const children = element.children;
        for (let i = 0; i < children.length; i++) {
            this.#removeArtificialElements(children[i] as HTMLElement);
        }
    }

    #handleClickElementSelection(e: Event) {
        const target = e.target as HTMLElement;

        const domTreeString = this.#generateDOMTreeString(target);
        const id = hashDomTreeString(domTreeString);

        if (this.#selectedElements.has(id)) {
            this.#removeSelection(id);
        } else {
            this.#addSelection(id, target, domTreeString);
        }

        const selectedElements = Array.from(this.#selectedElements.values()).map(({ id, element, domTreeString }) => ({
            id,
            tagName: element.tagName.toLowerCase(),
            domTreeString
        }));
        const selectedElementIds = Array.from(this.#selectedElements.keys());

        this.#toParent({
            type: 'element-selection',
            payload: {
                selectedElements,
                selectedElementIds,
                elementId: id,
                elementTree: domTreeString
            }
        });
    }

    #setupElementClickListeners() {
        const target = document.body ?? document;

        target.addEventListener('click', (e) => {
            if (this.#editorState.type === 'element-selection') {
                e.preventDefault();
                this.#handleClickElementSelection(e);
            }
        });
    }

    #setupElementHoverListeners() {
        this.#removeElementHoverListeners();

        const target = document.body ?? document;
        target.addEventListener('mouseover', this.#boundMouseOverListener);
        target.addEventListener('mouseout', this.#boundMouseOutListener);
    }

    #removeElementHoverListeners() {
        const target = document.body ?? document;
        target.removeEventListener('mouseover', this.#boundMouseOverListener);
        target.removeEventListener('mouseout', this.#boundMouseOutListener);
    }

    #handleMouseOver(e: MouseEvent) {
        if (this.#editorState.type !== 'element-selection') return;
        e.stopPropagation();
        const target = e.target as HTMLElement;

        const allElements = document.querySelectorAll('.editor-hover');
        allElements.forEach((element) => {
            element.classList.remove('editor-hover');
        });

        target.classList.add('editor-hover');
    }

    #handleMouseOut(e: MouseEvent) {
        if (this.#editorState.type !== 'element-selection') return;

        const target = e.target as HTMLElement;
        target.classList.remove('editor-hover');
    }

    #rebuildSelection(ids: string[]): string[] {
        this.#clearAllSelections();

        if (!Array.isArray(ids) || ids.length === 0) return [];

        const wanted = new Set(ids);
        const matched: string[] = [];

        const elements = document.querySelectorAll<HTMLElement>('*');
        elements.forEach((el) => {
            const domTreeString = this.#generateDOMTreeString(el);
            const id = hashDomTreeString(domTreeString);
            if (wanted.has(id)) {
                this.#addSelection(id, el, domTreeString);
                matched.push(id);
            }
        });

        const selectedElements = Array.from(this.#selectedElements.values()).map(({ id, domTreeString }) => ({
            id,
            domTreeString
        }));
        const selectedElementIds = Array.from(this.#selectedElements.keys());

        if (selectedElementIds.length > 0) {
            this.#editorState = EditorStates.ElementSelection;
            this.#toggleCrosshairCursor(true);
            this.#toParent({ type: 'status', payload: { status: this.#editorState.type } });
        }

        this.#toParent({
            type: 'selection-rebuilt',
            payload: {
                selectedElements,
                selectedElementIds
            }
        });

        return matched;
    }

    constructor() {
        this.#injectEditorStyles();
        this.#toggleCrosshairCursor(false);

        window.addEventListener('message', (event: MessageEvent<ParentToEditCommunicatorMessage>) => {
            if (!allowedOrigins.includes(event.origin)) {
                this.#toParent({ type: 'error', payload: { msg: `disallowed origin: ${event.origin}` } });
                return;
            }
            parentOrigin = event.origin;
            const { type, payload } = event.data;
            this.#toParent({ type: 'ack', payload: { message: event.data } });

            switch (type) {
                case 'ready':
                    this.#clearAllSelections();
                    this.#editorState = EditorStates.Ready;
                    this.#toggleCrosshairCursor(false);
                    this.#toParent({ type: 'status', payload: { status: this.#editorState.type } });
                    break;
                case 'tool-element-selection':
                    this.#clearAllSelections();
                    this.#editorState = EditorStates.ElementSelection;
                    this.#toggleCrosshairCursor(true);
                    this.#toParent({ type: 'status', payload: { status: this.#editorState.type } });
                    break;
                case 'clear-selection':
                    this.#toParent({ type: 'status', payload: { status: `clearing selections` } });
                    this.#clearAllSelections();
                    break;
                case 'remove-selection':
                    if (payload?.element) {
                        this.#toParent({ type: 'status', payload: { status: `removing ${payload.element}` } });
                        this.#removeSelection(payload.element);
                    }
                    break;
                case 'rebuild-selection': {
                    const ids: string[] = Array.isArray(payload?.ids) ? payload.ids : [];
                    this.#rebuildSelection(ids);
                    break;
                }
            }
        });

        this.#setupElementClickListeners();
        this.#setupElementHoverListeners();
        this.#editorState = EditorStates.Ready;
    }
}

let editorInstance: EditCommunicator | null = null;

export function initEditor(): EditCommunicator {
    if (!editorInstance) {
        editorInstance = new EditCommunicator();
    }
    return editorInstance;
}
