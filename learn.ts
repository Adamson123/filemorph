const nestedArr = [1, 2, 3, [4, 5], [6, [8, 9, 0]]];
const queueArr: Root[] = [];

console.log("Start");

let i = 0;
const root = {
  type: "array",
  index: i,
  children: nestedArr,
};

type Root = typeof root & {
  children?: any[];
};

let layer = 0;

queueArr.push(root);
while (queueArr.length) {
  const currentLayer = queueArr.shift();
  if (!currentLayer) continue;
  //      !Array.isArray(currentLayer.children)
  // Create a new array to store the transformed children
  const transformedChildren: any[] = [];
  //const children = { ...currentLayer }.children;

  for (const element of currentLayer.children) {
    if (Array.isArray(element)) {
      const newLayer = { type: "array", index: i, children: element };
      queueArr.push(newLayer);
      transformedChildren.push(newLayer); // Add transformed child
    } else {
      transformedChildren.push({ type: "number", index: i });
      i++;
    }
  }

  layer++;
  // Replace the original children with transformed ones
  currentLayer.children = transformedChildren;
}

console.log(JSON.stringify(root, null, 2), { layer });
