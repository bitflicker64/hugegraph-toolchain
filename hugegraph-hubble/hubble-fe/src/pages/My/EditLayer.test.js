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

import {act, fireEvent, render, screen} from '@testing-library/react';
import EditLayer from './EditLayer';
import * as api from '../../api';

jest.mock('../../api', () => ({
    auth: {
        updatePersonal: jest.fn(),
    },
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));

jest.mock('../../utils/rules', () => ({
    required: () => ({required: true}),
    isAccountName: msg => ({
        validator: (_, value) => (
            /^[a-zA-Z0-9]+$/.test(value ?? '')
                ? Promise.resolve()
                : Promise.reject(new Error(msg))
        ),
    }),
}));

const profile = {
    user_name: 'admin',
    user_nickname: 'Administrator',
    user_description: 'None',
};

const props = {
    visible: true,
    onCancel: jest.fn(),
    refresh: jest.fn(),
    data: profile,
};

const okButton = () => document.querySelector('.ant-modal-footer .ant-btn-primary');

const flush = () => act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
});

beforeEach(() => {
    jest.clearAllMocks();
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }));
});

test('handles the rejected validation promise instead of leaking it to the page', async () => {
    const rejections = [];
    const track = reason => rejections.push(reason);
    process.on('unhandledRejection', track);
    try {
        render(<EditLayer {...props} />);

        fireEvent.change(screen.getByDisplayValue('Administrator'), {
            target: {value: 'bad name with spaces'},
        });
        await act(async () => {
            fireEvent.click(okButton());
        });
        await flush();
    }
    finally {
        process.removeListener('unhandledRejection', track);
    }

    expect(api.auth.updatePersonal).not.toHaveBeenCalled();
    expect(rejections).toEqual([]);
});
