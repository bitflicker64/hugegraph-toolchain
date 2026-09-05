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
import {EditEdgeLayer} from './EditLayer';
import * as api from '../../../api';

jest.mock('react-i18next', () => ({
    initReactI18next: {type: '3rdParty', init: jest.fn()},
    useTranslation: () => ({t: key => key}),
}));

jest.mock('../../../i18n', () => ({t: key => key}));

jest.mock('../../../api', () => ({
    manage: {
        getMetaEdge: jest.fn(),
        getMetaEdgeList: jest.fn(),
        addMetaEdge: jest.fn(),
        updateMetaEdge: jest.fn(),
    },
}));

jest.mock('../../../components/ColorSelect', () => ({
    InputColorSelect: () => <input aria-label='color' />,
}));
jest.mock('../common/RelateProperty', () => () => <div>properties</div>);
jest.mock('../common/RelatePropertyIndex', () => () => <div>indexes</div>);

beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }));
    api.manage.getMetaEdgeList.mockResolvedValue({status: 200, data: {records: []}});
});

test('rejects an invalid edge label name before sending it', async () => {
    render(
        <EditEdgeLayer
            visible
            onCancle={jest.fn()}
            graphspace='DEFAULT'
            graph='hugegraph'
            refresh={jest.fn()}
            name=''
            propertyList={[]}
            vertexList={[]}
        />
    );

    const input = screen.getByPlaceholderText('schema.name_placeholder');
    expect(input).toHaveAttribute('maxlength', '128');
    fireEvent.change(input, {target: {value: 'bad name/x'}});
    fireEvent.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(input.closest('.ant-form-item'))
        .toHaveTextContent('common.validation.property_name_rule'));
    expect(api.manage.addMetaEdge).not.toHaveBeenCalled();
});
