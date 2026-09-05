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

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import EdgeTable from './index';
import * as api from '../../../api';

let mockRows = [];

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));

jest.mock('react-router-dom', () => ({
    useParams: () => ({graphspace: 'space', graph: 'graph'}),
}));

jest.mock('../common/useMetaTable', () => () => ({
    data: mockRows,
    pagination: {current: 1, pageSize: 10, total: mockRows.length},
    loading: false,
    error: false,
    retry: jest.fn(),
    handleTable: jest.fn(),
}));

jest.mock('./EditLayer', () => ({EditEdgeLayer: () => <div>edge editor</div>}));

jest.mock('../../../api', () => ({
    manage: {
        getMetaPropertyList: jest.fn(),
        getMetaVertexList: jest.fn(),
        delMetaEdge: jest.fn(),
    },
}));

beforeEach(() => {
    jest.clearAllMocks();
    mockRows = [];
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }));
    api.manage.getMetaPropertyList.mockResolvedValue({status: 200, data: {records: []}});
});

test('blocks edge type creation while the graph has no vertex type', async () => {
    api.manage.getMetaVertexList.mockResolvedValue({status: 200, data: {records: []}});

    render(<EdgeTable />);

    await waitFor(() => expect(api.manage.getMetaVertexList).toHaveBeenCalled());
    expect(screen.getByRole('button', {name: 'common.create'})).toBeDisabled();
});

test('allows edge type creation once a vertex type exists', async () => {
    api.manage.getMetaVertexList.mockResolvedValue({
        status: 200,
        data: {records: [{name: 'person'}]},
    });

    render(<EdgeTable />);

    await waitFor(() => expect(screen.getByRole('button', {name: 'common.create'}))
        .toBeEnabled());
});

test('names the edge types a batch delete is about to remove', async () => {
    mockRows = ['knows', 'created'].map(name => ({
        name,
        edgelabel_type: 'NORMAL',
        source_label: 'person',
        target_label: 'person',
        properties: [],
        sort_keys: [],
        open_label_index: false,
        property_indexes: [],
    }));
    api.manage.getMetaVertexList.mockResolvedValue({
        status: 200,
        data: {records: [{name: 'person'}]},
    });

    render(<EdgeTable />);

    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', {name: 'common.batch_delete'}));

    await waitFor(() => expect(document.querySelector('.ant-modal-confirm-title'))
        .toHaveTextContent('common.batch_delete'));
    expect(screen.getByText('knows, created')).toBeInTheDocument();
});
