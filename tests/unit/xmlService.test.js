import { jest } from '@jest/globals';
import fs from 'fs';

const { create_xml } = await import('../../src/services/xmlService.js');

const creation_input1 = fs.readFileSync('tests/inputs/creation_input_1.json', 'utf-8');
const creation_expectedContent = fs.readFileSync('tests/expected/creation_expected_1.xml', 'utf-8');

test('create_xml generates correct XML from input', () => {
  const xml_output = create_xml(JSON.parse(creation_input1));
  expect(xml_output.replace(/\s/g, '')).toEqual(creation_expectedContent.replace(/\s/g, ''));
});