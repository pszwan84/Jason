import {expect, test} from '@playwright/test';

test('distills an experience and restores the draft after a reload', async ({page}) => {
  const email = `distill-${Date.now()}@example.test`;
  const experience =
    '我在会议中经常遇到决定无法落地的问题。首先记录所有参与者和目标，然后把分歧拆成可验证的选项，最后确认负责人和截止时间，并在下一次会议复盘。';

  await page.goto('/studio');
  await page.goto('/studio');
  await page.getByRole('button', {name: '个人身份', exact: true}).click();
  const registerLink = page.getByRole('button', {name: '创建新账号', exact: true});
  if (await registerLink.isVisible().catch(() => false)) {
    await registerLink.click();
    await page.getByLabel('名字', {exact: true}).fill('提炼恢复测试');
    await page.getByLabel('邮箱', {exact: true}).fill(email);
    await page.getByLabel('密码（至少 12 字符）').fill('distill-password-123');
    await page.getByRole('button', {name: '注册并登录', exact: true}).click();
    await expect(page.getByRole('heading', {name: '我的身份', exact: true})).toBeVisible();
  }

  await page.getByRole('button', {name: '创建 Skill', exact: true}).click();
  // A fresh browser may still be logged out if the account check above found
  // an already-open account view. Complete registration from that view.
  const createAccount = page.getByRole('button', {name: '创建新账号', exact: true});
  if (await createAccount.isVisible().catch(() => false)) {
    await createAccount.click();
    await page.getByLabel('名字', {exact: true}).fill('提炼恢复测试');
    await page.getByLabel('邮箱', {exact: true}).fill(email);
    await page.getByLabel('密码（至少 12 字符）').fill('distill-password-123');
    await page.getByRole('button', {name: '注册并登录', exact: true}).click();
    await expect(page.getByRole('heading', {name: '我的身份', exact: true})).toBeVisible();
    await page.getByRole('button', {name: '创建 Skill', exact: true}).click();
  }
  await expect(page.getByRole('heading', {name: /让经验长成 Skill|继续培养/ })).toBeVisible({timeout: 15000});
  await page.getByPlaceholder('我遇到了什么问题？先做了什么？后来如何验证？').fill(experience);
  await page.getByRole('button', {name: '提炼成 Skill', exact: true}).click();

  await expect(page.getByLabel('Skill 名称', {exact: true})).toHaveValue('复盘实践方法');
  await expect(page.getByRole('textbox', {name: /工作步骤（每行一步）/})).toHaveValue(/记录所有参与者和目标/);

  // Reloading leaves the editor view, so re-entering the create flow should offer the local draft.
  await page.reload();
  await page.getByRole('button', {name: '创建 Skill', exact: true}).click();
  await expect(page.getByText('发现尚未提交的浏览器草稿。')).toBeVisible();
  await page.getByRole('button', {name: '恢复草稿', exact: true}).click();
  await expect(page.getByLabel('Skill 名称', {exact: true})).toHaveValue('复盘实践方法');
  await expect(page.getByRole('textbox', {name: /工作步骤（每行一步）/})).toHaveValue(/记录所有参与者和目标/);
});
