import test from 'node:test';import assert from 'node:assert/strict';import {normalizeDecision} from '../src/core.js';
const response=value=>({answers:{route:{type:'choice',choice:'auto_approve',probabilities:{auto_approve:value}},confidence_to_automate:{type:'noul',noul:.99}}});
test('numeric strings and booleans never authorize automatic routing',()=>{for(const value of ['1',true,false,'0.99',[],{}])assert.throws(()=>normalizeDecision(response(value)),/Numeric probability/);});
test('actual numeric selected probabilities preserve normal routing',()=>{assert.equal(normalizeDecision(response(.95)).route,'auto_approve');assert.equal(normalizeDecision(response(.1)).route,'manual_review');});
