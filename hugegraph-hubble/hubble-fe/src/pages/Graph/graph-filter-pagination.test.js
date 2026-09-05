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
import Graph from './index';
import * as api from '../../api';

let mockAuthContext;

jest.mock('../../auth/AuthContext', () => ({
    useAuthContext: () => mockAuthContext,
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));

jest.mock('react-router-dom', () => ({
    Link: ({children, to}) => <a href={to}>{children}</a>,
    useNavigate: () => jest.fn(),
    useParams: () => ({graphspace: 'space'}),
}));

jest.mock('../../api', () => ({
    manage: {
        getGraphSpace: jest.fn(),
        getGraphList: jest.fn(),
    },
}));

jest.mock('./EditLayer', () => ({EditLayer: () => null, ViewLayer: () => null}));
jest.mock('./Card', () => () => <div data-testid='graph-card'>graph card</div>);
jest.mock('./ClearGraphConfirmModal', () => () => null);

const installMatchMedia = () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }));
};

beforeAll(installMatchMedia);

beforeEach(() => {
    jest.clearAllMocks();
    installMatchMedia();
    sessionStorage.setItem('hubble_config_', JSON.stringify({
        pd_enabled: true,
        graph_create_enabled: true,
    }));
    mockAuthContext = {
        context: {role: 'SUPERADMIN', scopes: {all_graphspaces: true}},
    };
    api.manage.getGraphSpace.mockResolvedValue({
        status: 200,
        data: {name: 'space', nickname: 'Space'},
    });
    api.manage.getGraphList.mockResolvedValue({
        status: 200,
        data: {
            records: [{name: 'graph-a', nickname: 'Graph A', graphspace: 'space'}],
            total: 30,
        },
    });
});

test('applies a name filter from the first page instead of the current one', async () => {
    render(<Graph />);
    await screen.findByTestId('graph-card');

    fireEvent.click(document.querySelector('.ant-pagination-item-2'));
    await waitFor(() => expect(api.manage.getGraphList).toHaveBeenLastCalledWith(
        'space',
        expect.objectContaining({page_no: 2}),
        expect.anything()
    ));

    fireEvent.change(screen.getByPlaceholderText('graph.search_placeholder'), {
        target: {value: 'graph-a'},
    });
    fireEvent.click(screen.getByRole('button', {name: 'search'}));

    await waitFor(() => expect(api.manage.getGraphList).toHaveBeenLastCalledWith(
        'space',
        expect.objectContaining({page_no: 1, query: 'graph-a'}),
        expect.anything()
    ));
});
