/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import {render, screen} from '@testing-library/react';
import IconSelect from './index';
import enUSPages from '../../i18n/resources/en-US/modules/pages.json';
import zhCNPages from '../../i18n/resources/zh-CN/modules/pages.json';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key}),
}));

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

test('disabled icon selector uses localized placeholder without Chinese copy', () => {
    const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

    expect(source).not.toMatch(/[\u3400-\u9fff]/u);
    expect(source).toContain("placeholder={t('selector.placeholder')}");
});

test('names the icon picker so it is not just another blank selector', () => {
    render(<IconSelect value='UserOutlined' onChange={jest.fn()} />);

    expect(screen.getByLabelText('selector.icon_picker')).toHaveValue('UserOutlined');
});

test('names the disabled icon picker too', () => {
    render(<IconSelect disabled />);

    expect(screen.getByLabelText('selector.icon_picker')).toBeDisabled();
});

test('both locales translate the icon picker label', () => {
    expect(enUSPages.selector.icon_picker).toBe('Choose icon');
    expect(zhCNPages.selector.icon_picker).toBeTruthy();
});
