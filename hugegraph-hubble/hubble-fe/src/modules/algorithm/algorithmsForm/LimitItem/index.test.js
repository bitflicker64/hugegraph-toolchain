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

import {render, screen} from '@testing-library/react';
import GraphAnalysisContext from '../../../Context';
import {AlgorithmPersistenceContext} from '../algorithmFormPersistence';
import Form from '../PersistentForm';
import LimitItem from './index';

jest.mock('react-i18next', () => ({
    initReactI18next: {type: '3rdParty', init: jest.fn()},
    useTranslation: () => ({t: key => key}),
}));

beforeAll(() => {
    window.matchMedia = window.matchMedia || (() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }));
});

test('caps limit at the widest value the server can parse as an int', () => {
    render(
        <GraphAnalysisContext.Provider value={{graphSpace: 'DEFAULT', graph: 'hugegraph'}}>
            <AlgorithmPersistenceContext.Provider value='limit-ceiling-test'>
                <Form>
                    <LimitItem initialValue={10} />
                </Form>
            </AlgorithmPersistenceContext.Provider>
        </GraphAnalysisContext.Provider>
    );

    const limit = screen.getByLabelText('limit');

    expect(limit).toHaveValue('10');
    expect(limit).toHaveAttribute('aria-valuemax', '2147483647');
});
