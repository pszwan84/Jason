import test from 'node:test';
import assert from 'node:assert/strict';
import { slimSkills, isIconType } from '../lib/persist.ts';

test('persisted skills never carry an icon', () => {
  const Icon = () => null;
  const slim = slimSkills([
    { id: 1, title: '法律论文精读', icon: Icon, category: '法律馆', steps: ['a'], owner: 'local' },
  ]);
  assert.equal('icon' in slim[0], false, 'icon 过不了 JSON，不能进白名单');
  assert.deepEqual(slim[0], { id: 1, title: '法律论文精读', category: '法律馆', steps: ['a'], owner: 'local' });
});

test('isIconType rejects what storage hands back', () => {
  const Icon = () => null;
  assert.equal(isIconType(Icon), true, '函数组件');
  assert.equal(isIconType({ $$typeof: Symbol.for('react.forward_ref') }), true, 'forwardRef 图标是对象');
  assert.equal(isIconType({}), false, 'JSON 往返留下的空对象');
  assert.equal(isIconType(null), false);
  assert.equal(isIconType(undefined), false);
  assert.equal(isIconType('scale'), false, '字符串要走 category/键名回填');
  assert.equal(isIconType(0), false);
});
