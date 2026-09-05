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

import {fireEvent, render, screen} from '@testing-library/react';
import GraphResult from './index';
import GraphAnalysisContext from '../../../Context';
import {ALGORITHM_NAME, GRAPH_STATUS, GRAPH_RENDER_MODE, PANEL_TYPE} from '../../../../utils/constants';

const mockGraphInstance = {
    destroyLayout: jest.fn(),
    updateLayout: jest.fn(),
};

jest.mock('../../../component/Graph', () => {
    const {useEffect} = require('react');
    return props => {
        useEffect(
            () => {
                props.onGraphRender && props.onGraphRender(mockGraphInstance);
            },
            [props.onGraphRender]
        );
        return <div>{props.children}</div>;
    };
});
jest.mock('../../../component/Legend', () => () => null);
jest.mock('../../../component/MiniMap', () => () => null);
jest.mock('../GraphMenuBar', () => () => <div>graph menu</div>);
jest.mock('../../../component/Tooltip', () => () => null);
jest.mock('../GraphToolBar', () => () => null);
jest.mock('../../../component/Menu', () => () => null);
jest.mock('../../../component/NumberCard', () => () => null);
jest.mock('../../../component/EditElement', () => () => null);
jest.mock('../../../component/Search', () => () => null);
jest.mock('../../../component/SettingConfigPanel', () => () => null);
jest.mock('../../../component/layoutConfigPanel/Home', () => props => (
    <button type='button' onClick={() => props.onChange({type: 'circular'})}>
        change layout
    </button>
));
jest.mock('../../../component/ClosePanelButton', () => () => null);
jest.mock('../../../component/DynamicAddNode', () => () => null);
jest.mock('../../../component/DynamicAddEdge', () => () => null);
jest.mock('../NeighborRankView', () => () => null);
jest.mock('../../../component/StatisticsPanel/Home', () => () => null);
jest.mock('../RankApiView', () => () => null);
jest.mock('../JaccView', () => () => null);
jest.mock('../../../component/GraphStatusView', () => props => <div>{props.message}</div>);
jest.mock('../../../component/TaskNavigateView', () => () => null);
jest.mock('../../../component/Canvas3D', () => () => null);
jest.mock('../utils', () => ({
    fetchExpandInfo: jest.fn(),
    handleAddGraphNode: jest.fn(),
    handleAddGraphEdge: jest.fn(),
    handleExpandGraph: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
    Link: ({to, children}) => <a href={to}>{children}</a>,
}));
jest.mock('../../../../utils/formatGraphResultData', () => ({
    formatToGraphData: () => ({nodes: [], edges: []}),
    formatToOptionedGraphData: data => data,
    formatToStyleData: () => ({nodes: {}, edges: {}}),
    formatToDownloadData: data => data,
    updateGraphDataStyle: data => data,
    formatToLegendData: () => [],
}));
jest.mock('../../../../utils/graph', () => ({
    mapLayoutNameToLayoutDetails: () => ({}),
}));
jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));

test('places empty-graph recovery actions in the graph result area', () => {
    render(
        <GraphAnalysisContext.Provider value={{graphSpace: 'DEFAULT', graph: 'hugegraph'}}>
            <GraphResult
                data={{}}
                metaData={{edgeMeta: [], vertexMeta: []}}
                graphNums={{vertexCount: 0, edgeCount: 0}}
                queryStatus={GRAPH_STATUS.STANDBY}
                panelType={PANEL_TYPE.CLOSED}
                graphRenderMode={GRAPH_RENDER_MODE.CANVAS2D}
                onGraphRenderModeChange={jest.fn()}
                updatePanelType={jest.fn()}
            />
        </GraphAnalysisContext.Provider>
    );

    expect(screen.getByText('analysis.algorithm.empty_graph_title')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'analysis.algorithm.create_schema'}))
        .toHaveAttribute('href', '/graphspace/DEFAULT/graph/hugegraph/meta');
    expect(screen.getByRole('link', {name: 'analysis.algorithm.prepare_data'}))
        .toHaveAttribute('href', '/source');
});

test('changes the canvas layout without asking G6 to re-centre it', () => {
    render(
        <GraphAnalysisContext.Provider value={{graphSpace: 'DEFAULT', graph: 'hugegraph'}}>
            <GraphResult
                data={{vertices: [{id: '1'}], edges: []}}
                metaData={{edgeMeta: [], vertexMeta: []}}
                options={{}}
                algorithm={ALGORITHM_NAME.SHORTEST_PATH}
                isQueryMode
                graphNums={{vertexCount: 1, edgeCount: 0}}
                queryStatus={GRAPH_STATUS.SUCCESS}
                panelType={PANEL_TYPE.LAYOUT}
                graphRenderMode={GRAPH_RENDER_MODE.CANVAS2D}
                onGraphRenderModeChange={jest.fn()}
                updatePanelType={jest.fn()}
            />
        </GraphAnalysisContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', {name: 'change layout'}));

    expect(mockGraphInstance.destroyLayout).toHaveBeenCalledTimes(1);
    expect(mockGraphInstance.updateLayout).toHaveBeenCalledTimes(1);
    const [layoutArg, alignArg] = mockGraphInstance.updateLayout.mock.calls[0];
    expect(layoutArg).toEqual({type: 'circular', relayoutAtChangeData: false});
    // 'center' would register a G6 afterlayout re-centre computed from the pre-layout
    // matrix, which the canvas fitView handler has already replaced by then.
    expect(alignArg).toBeUndefined();
});
