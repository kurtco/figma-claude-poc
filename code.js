"use strict";
// Aumentamos el alto para mostrar información de la selección a Martha
figma.showUI(__html__, { width: 340, height: 320, themeColors: true });
/**
 * Envía la selección actual a la UI para que Claude tenga contexto.
 */
function sendSelectionToUI() {
    const selection = figma.currentPage.selection.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        // @ts-ignore - Propiedades para contexto de la IA
        width: node.width || 0,
        // @ts-ignore
        height: node.height || 0
    }));
    figma.ui.postMessage({ type: 'selection-updated', selection });
}
// Escuchar cambios en el canvas para mantener a Martha informada
figma.on('selectionchange', sendSelectionToUI);
async function processNode(data, parentNode) {
    let node = null;
    // 1. Intentar encontrar nodo existente si Claude provee un ID (Modificación)
    if (data.id) {
        const found = figma.getNodeById(data.id);
        if (found && found.type !== 'PAGE' && found.type !== 'DOCUMENT') {
            node = found;
        }
    }
    // 2. Si no hay ID o no se encontró, crear nodo nuevo (Creación)
    if (!node) {
        switch (data.type) {
            case 'COMPONENT':
                node = figma.createComponent();
                break;
            case 'FRAME':
                node = figma.createFrame();
                break;
            case 'TEXT':
                await figma.loadFontAsync(data.font || { family: "Inter", style: "Regular" });
                node = figma.createText();
                break;
            case 'RECTANGLE':
            default:
                node = figma.createRectangle();
                break;
        }
    }
    // 3. Aplicar propiedades (Válido para nuevos y existentes)
    node.name = data.name || node.name;
    if ('resize' in node && data.width && data.height) {
        node.resize(data.width, data.height);
    }
    if (data.type === 'TEXT' && 'characters' in node && data.characters) {
        await figma.loadFontAsync(node.fontName);
        node.characters = data.characters;
    }
    // 4. Auto Layout y Estilos
    if ('layoutMode' in node && data.layoutMode) {
        const f = node;
        f.layoutMode = data.layoutMode;
        f.itemSpacing = data.itemSpacing ?? f.itemSpacing;
        f.paddingLeft = data.paddingLeft ?? f.paddingLeft;
        f.paddingRight = data.paddingRight ?? f.paddingRight;
        f.paddingTop = data.paddingTop ?? f.paddingTop;
        f.paddingBottom = data.paddingBottom ?? f.paddingBottom;
    }
    if ('fills' in node && data.fills) {
        node.fills = data.fills;
    }
    // 5. Recursividad para Hijos
    if (data.children && Array.isArray(data.children) && 'appendChild' in node) {
        for (const childData of data.children) {
            await processNode(childData, node);
        }
    }
    // Solo añadir al padre si es un nodo recién creado
    if (!data.id) {
        parentNode.appendChild(node);
    }
    return node;
}
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'execute-design') {
        const nodes = [];
        const payload = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
        for (const data of payload) {
            const node = await processNode(data, figma.currentPage);
            nodes.push(node);
        }
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
    }
};
