/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to You under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import {useCallback, useContext, useEffect} from 'react';
import Graphin, {Behaviors, Components, GraphinContext} from '@antv/graphin';

const GRAPH_TOOLTIP_STYLE = {
    width: 300,
    padding: 12,
    borderRadius: 4,
    background: '#fff',
    pointerEvents: 'none',
};

const GraphDoubleClick = ({onDoubleClick}) => {
    const {graph} = useContext(GraphinContext);

    useEffect(() => {
        if (typeof onDoubleClick !== 'function') {
            return undefined;
        }
        const handleDoubleClick = evt => {
            const {item} = evt;
            const {id, type} = item._cfg;
            const model = item.getModel();
            onDoubleClick(id, type, model.data, model, item, evt);
        };
        graph.on('node:dblclick', handleDoubleClick);
        graph.on('edge:dblclick', handleDoubleClick);
        return () => {
            graph.off('node:dblclick', handleDoubleClick);
            graph.off('edge:dblclick', handleDoubleClick);
        };
    }, [graph, onDoubleClick]);

    return null;
};

/**
 * Graphin always mounts its ResizeCanvas behaviour, which debounces the window
 * resize event by 200ms and then runs graph.set('width', ...). Unmounting
 * Graphin destroys the G6 instance first and leaves graph.cfg null, so a resize
 * queued by the disappearing canvas still reaches that setter and throws
 * "Cannot set properties of null (setting 'width')". Handing the destroyed
 * instance an empty cfg back makes the late write land on an object nobody
 * reads; the rest of that handler already guards on graph.get('canvas').
 */
const GraphResizeGuard = () => {
    const {graph} = useContext(GraphinContext);

    useEffect(() => {
        return () => {
            if (graph?.destroyed && !graph.cfg) {
                graph.cfg = {};
            }
        };
    }, [graph]);

    return null;
};

const GraphView =  ({
    data,
    width,
    height,
    layout,
    style,
    onClick,
    onDoubleClick,
    config,
    behaviors,
    nodeTooltip,
    edgeTooltip,
}) => {
    // const [graphData, setGraphData] = useState([]);

    const {DragCanvas, ZoomCanvas, DragNode, ClickSelect, Hoverable} = Behaviors;
    const graphinLayout = {
        type: 'graphin-force',
        animation: false,
        ...layout,
        // type: 'preset',
    };

    const handleClickSelect = useCallback(evt => {
        const {item} = evt;
        const {id, type} = item._cfg;
        const model = item.getModel();

        typeof onClick === 'function' && onClick(id, type, model.data, model, item, evt);
    }, [onClick]);

    return (
        <div>
            <Graphin
                data={data}
                layout={graphinLayout}
                width={width}
                height={height}
                style={style}
                {...config}
            >
                <DragCanvas {...behaviors?.dragCanvas} />
                <ZoomCanvas {...behaviors?.zoomCanvas} />
                <DragNode {...behaviors?.dragNode} />
                <ClickSelect
                    selectEdge
                    onClick={handleClickSelect}
                    {...behaviors?.clickSelect}
                />
                <Hoverable bindType="edge" {...behaviors?.hoverable} />
                <Hoverable bindType="node" {...behaviors?.hoverable} />
                <GraphDoubleClick onDoubleClick={onDoubleClick} />
                <GraphResizeGuard />
                {nodeTooltip && (
                    <Components.Tooltip bindType='node' style={GRAPH_TOOLTIP_STYLE}>
                        {nodeTooltip}
                    </Components.Tooltip>
                )}
                {edgeTooltip && (
                    <Components.Tooltip bindType='edge' style={GRAPH_TOOLTIP_STYLE}>
                        {edgeTooltip}
                    </Components.Tooltip>
                )}
                {/* <ActivateRelations trigger='click' /> */}
            </Graphin>
        </div>
    );
};

export default GraphView;

export {GraphDoubleClick, GraphResizeGuard};
