"use strict";
figma.showUI(__html__, { width: 320, height: 260 });
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'draw-nodes') {
        const nodes = [];
        const payload = msg.payload;
        for (const nodeData of payload) {
            if (nodeData.type === 'RECTANGLE') {
                const rect = figma.createRectangle();
                rect.x = nodeData.x || figma.viewport.center.x;
                rect.y = nodeData.y || figma.viewport.center.y;
                rect.resize(nodeData.width || 100, nodeData.height || 100);
                if (nodeData.fills) {
                    rect.fills = nodeData.fills;
                }
                nodes.push(rect);
                figma.currentPage.appendChild(rect);
            }
            if (nodeData.type === 'TEXT') {
                await figma.loadFontAsync({ family: "Inter", style: "Regular" });
                const text = figma.createText();
                text.x = nodeData.x || figma.viewport.center.x;
                text.y = nodeData.y || figma.viewport.center.y;
                text.characters = nodeData.characters || "Texto";
                nodes.push(text);
                figma.currentPage.appendChild(text);
            }
        }
        if (nodes.length > 0) {
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
        }
    }
};
