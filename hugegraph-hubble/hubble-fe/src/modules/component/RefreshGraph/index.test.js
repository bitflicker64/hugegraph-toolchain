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
import RefreshGraph from './index';
import {GraphContext} from '../Context';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));

const renderRefreshGraph = graph => {
    render(
        <GraphContext.Provider value={{graph}}>
            <RefreshGraph />
        </GraphContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', {
        name: 'analysis.canvas.toolbar.refresh_layout',
    }));
};

test('refreshes the layout without asking G6 to re-centre it', () => {
    const graph = {
        cfg: {layout: {type: 'circular'}},
        destroyLayout: jest.fn(),
        updateLayout: jest.fn(),
    };

    renderRefreshGraph(graph);

    expect(graph.destroyLayout).toHaveBeenCalledTimes(1);
    expect(graph.updateLayout).toHaveBeenCalledTimes(1);
    const [layoutArg, alignArg] = graph.updateLayout.mock.calls[0];
    expect(layoutArg).toEqual({type: 'circular', relayoutAtChangeData: false});
    // 'center' would register a G6 afterlayout re-centre that uses the pre-layout
    // matrix, which the canvas fitView handler has already replaced by then.
    expect(alignArg).toBeUndefined();
});

test('does nothing when the canvas has no layout configured', () => {
    const graph = {
        cfg: {},
        destroyLayout: jest.fn(),
        updateLayout: jest.fn(),
    };

    renderRefreshGraph(graph);

    expect(graph.destroyLayout).not.toHaveBeenCalled();
    expect(graph.updateLayout).not.toHaveBeenCalled();
});
