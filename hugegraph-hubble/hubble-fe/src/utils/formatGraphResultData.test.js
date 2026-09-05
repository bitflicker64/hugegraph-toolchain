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

jest.mock('@antv/graphin-icons', () => () => ({glyphs: []}));

import {
    formatToDownloadData,
    formatToGraphData,
} from './formatGraphResultData';

const metaData = {
    vertexMeta: [
        {
            name: 'person',
            style: {
                display_fields: ['~id'],
            },
        },
    ],
    edgeMeta: [
        {
            name: 'knows',
            style: {
                display_fields: ['~id'],
            },
        },
    ],
};

test('uses a readable edge label by default without losing the full edge id', () => {
    const graphData = formatToGraphData({
        vertices: [],
        edges: [
            {
                id: 'edge-1',
                label: 'knows',
                source: 'v1',
                target: 'v2',
                properties: {},
            },
        ],
    }, metaData, {});

    expect(graphData.edges[0].id).toBe('edge-1');
    expect(graphData.edges[0].label).toBe('knows');
    expect(graphData.edges[0].rawLabel).toBe('knows');
    expect(graphData.edges[0].itemType).toBe('knows');
    expect(graphData.edges[0].legendType).toBe('knows');
});

test('falls back to the full edge id when the edge label is missing', () => {
    const graphData = formatToGraphData({
        vertices: [],
        edges: [{id: 'edge-1', source: 'v1', target: 'v2', properties: {}}],
    }, metaData, {});

    expect(graphData.edges[0].label).toBe('edge-1');
    expect(graphData.edges[0].id).toBe('edge-1');
});

test('exports raw edge label instead of display label', () => {
    const graphData = formatToGraphData({
        vertices: [],
        edges: [
            {
                id: 'edge-1',
                label: 'knows',
                source: 'v1',
                target: 'v2',
                properties: {since: 2026},
            },
        ],
    }, {
        ...metaData,
        edgeMeta: [
            {
                name: 'knows',
                style: {
                    display_fields: ['since'],
                },
            },
        ],
    }, {});

    expect(graphData.edges[0].label).toBe('2026');
    expect(formatToDownloadData(graphData).edges[0]).toEqual({
        id: 'edge-1',
        label: 'knows',
        source: 'v1',
        target: 'v2',
        properties: {since: 2026},
    });
});

test('clamps a long node label so it cannot be drawn across its neighbours', () => {
    const longId = '1:Wolfeschlegelsteinhausenbergerdorff';
    const graphData = formatToGraphData({
        vertices: [
            {id: longId, label: 'person', properties: {}},
            {id: '1:marko', label: 'person', properties: {}},
        ],
        edges: [],
    }, metaData, {});

    // G6 4.8.25 has no textOverflow/maxWidth for labels, so the string itself is bounded.
    expect(graphData.nodes[0].label).toBe('1:Wolfeschlegelst...');
    expect(graphData.nodes[0].id).toBe(longId);
    expect(graphData.nodes[1].label).toBe('1:marko');
});

test('clamps a long edge display field without touching the exported properties', () => {
    const longNote = 'n'.repeat(84);
    const graphData = formatToGraphData({
        vertices: [],
        edges: [
            {
                id: 'edge-1',
                label: 'knows',
                source: 'v1',
                target: 'v2',
                properties: {note: longNote},
            },
        ],
    }, {
        ...metaData,
        edgeMeta: [
            {
                name: 'knows',
                style: {
                    display_fields: ['note'],
                },
            },
        ],
    }, {});

    expect(graphData.edges[0].label).toBe(`${'n'.repeat(17)}...`);
    expect(formatToDownloadData(graphData).edges[0].properties).toEqual({note: longNote});
});
