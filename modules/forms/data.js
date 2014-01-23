var data = [ // Pass an array of nodes.
                {title: "Item 1"},
                {title: "Folder 2", isFolder: true,
                    children: [
                        {title: "Sub-item 2.1"},
                        {title: "Sub-item 2.2"},
                        {title: "Folder 2", isFolder: true,
                    children: [
                        {title: "Sub-item 2.1"},
                        {title: "Sub-item 2.2"}
                    ]
                }
                    ]
                },
                {title: "Item 3"}
            ];

var dnd = {
        // Make tree nodes draggable:
        onDragStart: null, // Callback(sourceNode), return true, to enable dnd
        onDragStop: null, // Callback(sourceNode)
        // Make tree nodes accept draggables
        autoExpandMS: 1000, // Expand nodes after n milliseconds of hovering.
        preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
        revert: false, // true: slide helper back to source if drop is rejected
        onDragEnter: null, // Callback(targetNode, sourceNode, ui, draggable)
        onDragOver: null, // Callback(targetNode, sourceNode, hitMode)
        onDrop: null, // Callback(targetNode, sourceNode, hitMode, ui, draggable)
        onDragLeave: null // Callback(targetNode, sourceNode)
    };

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var dnd2 = {
            onDragStart: function(node) {
                /** This function MUST be defined to enable dragging for the tree.
                 *  Return false to cancel dragging of node.
                 */
                //logMsg("tree.onDragStart(%o)", node);
                return true;
            },
            onDragEnter: function(node, sourceNode) {
			        /** sourceNode may be null for non-dynatree droppables.
			         *  Return false to disallow dropping on node. In this case
			         *  onDragOver and onDragLeave are not called.
			         *  Return 'over', 'before, or 'after' to force a hitMode.
			         *  Return ['before', 'after'] to restrict available hitModes.
			         *  Any other return value will calc the hitMode from the cursor position.
			         */
			        // Prevent dropping a parent below another parent (only sort
			        // nodes under the same parent)

			        // Don't allow dropping *over* a node (would create a child)

                    //console.log(node);
                    if (node.data.isFolder) {
                        return ['over'];
                    } else {
                        return ['before', 'after'];
                    }
			      },
            onDrop: function(node, sourceNode, hitMode, ui, draggable) {
                /** This function MUST be defined to enable dropping of items on
                 * the tree.
                 */
                //logMsg("tree.onDrop(%o, %o, %s)", node, sourceNode, hitMode);

                if (sourceNode.tree.divTree.id == 'tree2') {
                    var copynode = sourceNode.toDict(true, function (dict) {
                        delete dict.key;
                    });
                    var id = makeid();
                    copynode.title =  id+':'+copynode.title

                    if(hitMode == "over"){
                      // Append as child node
                      node.addChild(copynode);
                      // expand the drop target
                      node.expand(true);
                      container = node;
                    }else if(hitMode == "before"){
                      // Add before this, i.e. as child of current parent
                      node.parent.addChild(copynode, node);
                      container = node.parent;
                      sibling = node;
                    }else if(hitMode == "after"){
                      // Add after this, i.e. as child of current parent
                      node.parent.addChild(copynode, node.getNextSibling());
                      container = node.parent;
                      sibling = node.getNextSibling();
                    }
                    var key = copynode.title;
                    var parent = container.parent.span.innerText;
                    var zoneName = container.span.innerText;
                    var before = sibling.span.innerText;
                    state[key] = {'a':true};
                    var zone = state[parent]['zones'][zoneName];
                    var index = zone.indexOf(before.split(':')[0]);
                    console.log(before.split(':')[0]);
                    console.log(index);
                    if (index === -1)
                        zone.push(id);
                    else
                        zone.splice(index, 0, id);
                } else {
                    sourceNode.move(node, hitMode);
                }

            }
        };