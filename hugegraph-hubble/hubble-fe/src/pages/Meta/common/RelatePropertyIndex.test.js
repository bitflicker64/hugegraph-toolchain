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
import {Button, Form} from 'antd';
import RelatePropertyIndex from './RelatePropertyIndex';
import {indexTypeOptions} from './config';

jest.mock('react-i18next', () => ({
    initReactI18next: {type: '3rdParty', init: jest.fn()},
    useTranslation: () => ({t: key => key}),
}));

jest.mock('../../../i18n', () => ({t: key => key}));

const SECONDARY = indexTypeOptions.find(item => item.value === 'SECONDARY');
const UNIQUE = indexTypeOptions.find(item => item.value === 'UNIQUE');
const NO_EXISTING_INDEX = [];
const PRIMARY_KEYS = ['city'];
const propertyList = [
    {label: 'city', value: 'city', data_type: 'TEXT'},
    {label: 'age', value: 'age', data_type: 'INT'},
];
const selectedPropertyList = [
    {label: 'city', value: 'city', name: 'city', nullable: false},
    {label: 'age', value: 'age', name: 'age', nullable: true},
];

const IndexForm = ({onFinish, isEdit}) => (
    <Form onFinish={onFinish}>
        <RelatePropertyIndex
            selectedPropertyList={selectedPropertyList}
            propertyList={propertyList}
            exist={NO_EXISTING_INDEX}
            isEdit={isEdit}
            primaryKeys={PRIMARY_KEYS}
        />
        <Button htmlType='submit'>submit</Button>
    </Form>
);

const findOption = async text => {
    const matches = await screen.findAllByText(text);
    return matches.find(item => item.classList.contains('ant-select-item-option-content'));
};

const fillIndexRow = async (name, typeLabel) => {
    fireEvent.click(screen.getByRole('button', {name: '+common.action.add'}));
    fireEvent.change(screen.getByPlaceholderText('schema.index.col.name'), {
        target: {value: name},
    });

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await findOption(typeLabel));

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await findOption('age'));

    fireEvent.click(screen.getByRole('button', {name: 'submit'}));
};

beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }));
});

test('submits the chosen index type and fields when creating a label', async () => {
    const onFinish = jest.fn();
    render(<IndexForm onFinish={onFinish} isEdit={false} />);

    await fillIndexRow('payloadIdx', SECONDARY.label);

    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(onFinish.mock.calls[0][0].property_indexes).toEqual([
        {name: 'payloadIdx', type: 'SECONDARY', fields: ['age']},
    ]);
});

test('submits the chosen index type and fields when appending in edit mode', async () => {
    const onFinish = jest.fn();
    render(<IndexForm onFinish={onFinish} isEdit />);

    await fillIndexRow('p2Unique', UNIQUE.label);

    await waitFor(() => expect(onFinish).toHaveBeenCalled());
    expect(onFinish.mock.calls[0][0].append_property_indexes).toEqual([
        {name: 'p2Unique', type: 'UNIQUE', fields: ['age']},
    ]);
});

test('reports a blank property index row instead of sending it', async () => {
    const onFinish = jest.fn();
    render(<IndexForm onFinish={onFinish} isEdit={false} />);

    fireEvent.click(screen.getByRole('button', {name: '+common.action.add'}));
    fireEvent.click(screen.getByRole('button', {name: 'submit'}));

    expect(await screen.findAllByText('common.validation.required')).toHaveLength(3);
    expect(onFinish).not.toHaveBeenCalled();
});
