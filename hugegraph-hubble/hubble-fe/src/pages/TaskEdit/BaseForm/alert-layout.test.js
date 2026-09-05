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

import fs from 'fs';
import path from 'path';

const component = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const stylesheet = fs.readFileSync(
    path.join(__dirname, '..', 'index.module.scss'), 'utf8'
);

test('keeps the demo alert text column from collapsing under its button group', () => {
    // antd only gives `.ant-alert-content` `flex: 1 1 0%`, so without a basis of its
    // own the demo button group takes the whole row and the title and description
    // render one character per line. Browser evidence is needed for the rendered
    // height; this pins the contract that produces it.
    expect(component).toContain('className={style.demo_alert}');
    expect(stylesheet).toMatch(
        /\.demo_alert\s*\{[\s\S]*flex-wrap:\s*wrap/
    );
    expect(stylesheet).toMatch(
        /\.demo_alert\s*\{[\s\S]*\.ant-alert-content[\s\S]*flex:\s*1\s+1\s+240px/
    );
});
