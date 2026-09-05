/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to You under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter, useNavigate} from 'react-router-dom';
import TaskEdit from './index';
import {loadTaskBaseContext} from './taskFlow';

jest.mock('../../api', () => ({manage: {}}));
jest.mock('../../components/DataPreparationNav', () => () => null);
jest.mock('./taskFlow', () => ({
    createTaskOnce: jest.fn(),
    getTaskSubmissionError: jest.fn(),
    loadTaskBaseContext: jest.fn(),
}));
jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));
jest.mock('./BaseForm/index', () => {
    const {Button, Form, Input} = jest.requireActual('antd');

    return ({visible}) => (
        <div data-testid='step-base' style={{display: visible ? '' : 'none'}}>
            <Form
                name='base_form'
                initialValues={{
                    datasource_id: 1,
                    ingestion_option: {graphspace: 'DEFAULT', graph: 'g1'},
                }}
            >
                <Form.Item name='datasource_id' hidden><Input /></Form.Item>
                <Form.Item name={['ingestion_option', 'graphspace']} hidden>
                    <Input />
                </Form.Item>
                <Form.Item name={['ingestion_option', 'graph']} hidden>
                    <Input />
                </Form.Item>
                <Button htmlType='submit'>next</Button>
            </Form>
        </div>
    );
});
jest.mock('./FieldForm/index', () => ({visible}) => (
    <div data-testid='step-fields' style={{display: visible ? '' : 'none'}} />
));
jest.mock('./MappingForm/index', () => ({visible}) => (
    <div data-testid='step-mapping' style={{display: visible ? '' : 'none'}} />
));
jest.mock('./ScheduleForm/index', () => ({visible}) => (
    <div data-testid='step-schedule' style={{display: visible ? '' : 'none'}} />
));

const BrowserBack = () => {
    const navigate = useNavigate();

    return (
        <button type='button' onClick={() => navigate(-1)}>browser back</button>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }));
});

it('walks the wizard back through history instead of leaving it', async () => {
    loadTaskBaseContext.mockResolvedValue({
        datasource: {datasource_id: 1, datasource_config: {type: 'FILE'}},
        graphspace: {storage_percent: 0},
    });

    render(
        <MemoryRouter initialEntries={['/task/edit']}>
            <BrowserBack />
            <TaskEdit />
        </MemoryRouter>
    );

    expect(screen.getByTestId('step-base')).toBeVisible();
    fireEvent.click(screen.getByRole('button', {name: 'next'}));
    await waitFor(() => expect(screen.getByTestId('step-fields')).toBeVisible());
    expect(screen.getByTestId('step-base')).not.toBeVisible();

    fireEvent.click(screen.getByRole('button', {name: 'browser back'}));

    await waitFor(() => expect(screen.getByTestId('step-base')).toBeVisible());
    expect(screen.getByTestId('step-fields')).not.toBeVisible();
});

it('restarts the wizard when history restores a step whose values are gone', async () => {
    render(
        <MemoryRouter
            initialEntries={[{pathname: '/task/edit', state: {task_edit_step: 2}}]}
        >
            <TaskEdit />
        </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByTestId('step-base')).toBeVisible());
    expect(screen.getByTestId('step-mapping')).not.toBeVisible();
});
