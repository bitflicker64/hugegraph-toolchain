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

import {positiveIntegerValidator} from './index';

describe('positiveIntegerValidator', () => {
    it('rejects the null InputNumber reports for text it cannot parse', async () => {
        await expect(positiveIntegerValidator({}, null)).rejects.toThrow();
    });

    it('leaves an untouched optional field valid', async () => {
        await expect(positiveIntegerValidator({}, undefined))
            .resolves.toBeUndefined();
    });

    it('keeps accepting integers greater than zero', async () => {
        await expect(positiveIntegerValidator({}, 3)).resolves.toBeUndefined();
        await expect(positiveIntegerValidator({}, -5)).rejects.toThrow();
        await expect(positiveIntegerValidator({}, 1.5)).rejects.toThrow();
    });
});
