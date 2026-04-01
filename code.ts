type FigmaContainer = PageNode | FrameNode | ComponentNode | InstanceNode | GroupNode | SectionNode;

// Increase UI height to display selection context for the user
figma.showUI(__html__, { width: 340, height: 320, themeColors: true });

/**
 * Sends the current selection to the UI to provide context for Claude.
 */
function sendSelectionToUI() {
  const selection = figma.currentPage.selection.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    // @ts-ignore - Properties for AI context
    width: node.width || 0,
    // @ts-ignore
    height: node.height || 0
  }));
  
  figma.ui.postMessage({ type: 'selection-updated', selection });
}

// Listen for canvas selection changes to keep the UI synchronized
figma.on('selectionchange', sendSelectionToUI);

async function processNode(data: any, parentNode: FigmaContainer) {
  let node: SceneNode | null = null;

  // 1. Attempt to find an existing node if Claude provides an ID (Modification flow)
  if (data.id) {
    const found = figma.getNodeById(data.id);
    if (found && found.type !== 'PAGE' && found.type !== 'DOCUMENT') {
      node = found as SceneNode;
    }
  }

  // 2. If no ID is provided or found, create a new node (Creation flow)
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

  // 3. Apply properties (Valid for both new and existing nodes)
  node.name = data.name || node.name;
  
  if ('resize' in node && data.width && data.height) {
    node.resize(data.width, data.height);
  }

  if (data.type === 'TEXT' && 'characters' in node && data.characters) {
    await figma.loadFontAsync((node as TextNode).fontName as FontName);
    (node as TextNode).characters = data.characters;
  }

  // 4. Auto Layout and Styles
  if ('layoutMode' in node && data.layoutMode) {
    const f = node as FrameNode | ComponentNode;
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

  // 5. Recursion for child nodes
  if (data.children && Array.isArray(data.children) && 'appendChild' in node) {
    for (const childData of data.children) {
      await processNode(childData, node as unknown as FigmaContainer);
    }
  }

  // Only append to parent if it's a newly created node (prevents unintended re-parenting)
  if (!data.id) {
    parentNode.appendChild(node);
  }
  
  return node;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'execute-design') {
    const nodes: SceneNode[] = [];
    const payload = Array.isArray(msg.payload) ? msg.payload : [msg.payload];

    for (const data of payload) {
      const node = await processNode(data, figma.currentPage);
      nodes.push(node);
    }

    // Set selection and focus the viewport on generated/modified content
    figma.currentPage.selection = nodes; 
    figma.viewport.scrollAndZoomIntoView(nodes);
  }
};