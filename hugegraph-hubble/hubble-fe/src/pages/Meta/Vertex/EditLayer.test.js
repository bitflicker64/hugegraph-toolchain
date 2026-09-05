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
import {EditVertexLayer} from './EditLayer';
import {idOptions} from '../common/config';
import * as api from '../../../api';

jest.mock('react-i18next', () => ({
    initReactI18next: {type: '3rdParty', init: jest.fn()},
    useTranslation: () => ({t: key => key}),
}));

jest.mock('../../../i18n', () => ({t: key => key}));

jest.mock('../../../api', () => ({
    manage: {
        getMetaVertex: jest.fn(),
        addMetaVertex: jest.fn(),
        updateMetaVertex: jest.fn(),
    },
}));

jest.mock('../../../components/ColorSelect', () => ({
    InputColorSelect: () => <input aria-label='color' />,
}));
jest.mock('../../../components/IconSelect', () => ({value}) => (
    <input aria-label='icon' value={value ?? ''} readOnly />
));

const mockIndexProps = {current: null};
jest.mock('../common/RelatePropertyIndex', () => props => {
    mockIndexProps.current = props;
    return <div>indexes</div>;
});

const AUTOMATIC = idOptions.find(item => item.value === 'AUTOMATIC');

const renderCreateForm = () => render(
    <EditVertexLayer
        visible
        onCancle={jest.fn()}
        graphspace='DEFAULT'
        graph='hugegraph'
        refresh={jest.fn()}
        name=''
        propertyList={[]}
    />
);

const chooseOption = async label => {
    const matches = await screen.findAllByText(label);
    fireEvent.click(matches.find(
        item => item.classList.contains('ant-select-item-option-content')
    ));
};

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
    api.manage.addMetaVertex.mockResolvedValue({status: 200});
});

test('creates a vertex label with a default style icon', async () => {
    renderCreateForm();

    expect(screen.getByLabelText('icon')).toHaveValue('UserOutlined');

    fireEvent.change(screen.getByPlaceholderText('schema.name_placeholder'), {
        target: {value: 'autovertex'},
    });
    fireEvent.mouseDown(screen.getByRole('combobox', {
        name: 'schema.vertex.col.id_strategy',
    }));
    await chooseOption(AUTOMATIC.label);
    fireEvent.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(api.manage.addMetaVertex).toHaveBeenCalled());
    const payload = api.manage.addMetaVertex.mock.calls[0][2];
    expect(payload.name).toBe('autovertex');
    expect(payload.style.icon).toBe('UserOutlined');
});

test('rejects an invalid vertex label name before sending it', async () => {
    renderCreateForm();

    const input = screen.getByPlaceholderText('schema.name_placeholder');
    expect(input).toHaveAttribute('maxlength', '128');
    fireEvent.change(input, {target: {value: 'bad name/x'}});
    fireEvent.click(screen.getByRole('button', {name: 'OK'}));

    await waitFor(() => expect(input.closest('.ant-form-item'))
        .toHaveTextContent('common.validation.property_name_rule'));
    expect(api.manage.addMetaVertex).not.toHaveBeenCalled();
});

test('edits a label with its own primary keys and the property appended in the same form', async () => {
    api.manage.getMetaVertex.mockResolvedValue({
        status: 200,
        data: {
            name: 'person',
            properties: [{name: 'city', nullable: false}],
            property_indexes: [],
            id_strategy: 'PRIMARY_KEY',
            primary_keys: ['city'],
            open_label_index: false,
            style: {
                color: '#5c73e6', size: 'NORMAL', icon: 'UserOutlined', display_fields: ['~id'],
            },
        },
    });

    render(
        <EditVertexLayer
            visible
            onCancle={jest.fn()}
            graphspace='DEFAULT'
            graph='hugegraph'
            refresh={jest.fn()}
            name='person'
            propertyList={[
                {label: 'city', value: 'city', data_type: 'TEXT'},
                {label: 'age', value: 'age', data_type: 'INT'},
            ]}
        />
    );

    await screen.findByDisplayValue('person');
    await waitFor(() => expect(mockIndexProps.current.primaryKeys).toEqual(['city']));

    fireEvent.click(screen.getByRole('button', {name: '+common.action.add'}));
    fireEvent.mouseDown(document.getElementById('append_properties_0_name'));
    fireEvent.click(await screen.findByText('age', {
        selector: '.ant-select-item-option-content',
    }));

    await waitFor(() => expect(
        mockIndexProps.current.selectedPropertyList.map(item => item.value)
    ).toEqual(['city', 'age']));
});
