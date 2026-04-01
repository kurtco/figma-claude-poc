// Define el tipo para contenedores válidos en Figma
type FigmaContainer = PageNode | FrameNode | ComponentNode | InstanceNode | GroupNode | SectionNode;

figma.showUI(__html__, { width: 340, height: 280, themeColors: true });

async function processNode(data: any, parentNode: FigmaContainer) {
  let node: SceneNode;

  // 1. Creación de Nodo según el tipo definido por Claude
  switch (data.type) {
    case 'COMPONENT':
      node = figma.createComponent();
      break;
    case 'FRAME':
      node = figma.createFrame();
      break;
    case 'TEXT':
      const font = data.font || { family: "Inter", style: "Regular" };
      await figma.loadFontAsync(font);
      const text = figma.createText();
      text.characters = data.characters || "Text";
      if (data.fontSize) text.fontSize = data.fontSize;
      node = text;
      break;
    case 'RECTANGLE':
    default:
      node = figma.createRectangle();
      break;
  }

  // 2. Configuración de Nombre y Dimensiones
  node.name = data.name || data.type;
  if ('resize' in node && data.width && data.height) {
    node.resize(data.width, data.height);
  }

  // 3. Posicionamiento Relativo (Solo si no hay Auto Layout en el padre)
  if (!('layoutMode' in parentNode && (parentNode as any).layoutMode !== 'NONE')) {
    node.x = data.x ?? figma.viewport.center.x;
    node.y = data.y ?? figma.viewport.center.y;
  }

  // 4. Implementación de Auto Layout para Martha (UX Workflow)
  if ('layoutMode' in node && data.layoutMode) {
    const f = node as FrameNode | ComponentNode;
    f.layoutMode = data.layoutMode; // 'HORIZONTAL' | 'VERTICAL'
    f.itemSpacing = data.itemSpacing || 0;
    f.paddingLeft = data.paddingLeft || 0;
    f.paddingRight = data.paddingRight || 0;
    f.paddingTop = data.paddingTop || 0;
    f.paddingBottom = data.paddingBottom || 0;
    f.primaryAxisSizingMode = data.primaryAxisSizingMode || 'AUTO';
    f.counterAxisSizingMode = data.counterAxisSizingMode || 'AUTO';
  }

  // 5. Aplicación de Estilos Visuales
  if ('fills' in node && data.fills) {
    node.fills = data.fills;
  }

  // 6. Recursividad: Procesamiento de Hijos
  if (data.children && Array.isArray(data.children) && 'appendChild' in node) {
    for (const childData of data.children) {
      await processNode(childData, node as unknown as FigmaContainer);
    }
  }

  parentNode.appendChild(node);
  return node;
}

// Listener principal para recibir el payload de ui.html
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'execute-design') {
    const createdNodes: SceneNode[] = [];
    const payload = Array.isArray(msg.payload) ? msg.payload : [msg.payload];

    for (const data of payload) {
      const node = await processNode(data, figma.currentPage);
      createdNodes.push(node);
    }

    if (createdNodes.length > 0) {
      figma.currentPage.selection = createdNodes;
      figma.viewport.scrollAndZoomIntoView(createdNodes);
    }
  }
};