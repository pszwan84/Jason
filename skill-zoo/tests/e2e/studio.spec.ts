import {test,expect} from '@playwright/test';
test('register, publish, reload, edit, bookmark, and mobile layout',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/studio');
 await page.getByRole('button',{name:'个人身份',exact:true}).click();
 const register=page.getByRole('button',{name:'创建新账号',exact:true});
 if(await register.isVisible().catch(()=>false)){
  await register.click();
  await page.getByLabel('名字',{exact:true}).fill('浏览器测试用户');
  await page.getByLabel('邮箱',{exact:true}).fill(`browser-${Date.now()}@example.test`);
  await page.getByLabel('密码（至少 12 字符）').fill('browser-password-123');
  await page.getByRole('button',{name:'注册并登录',exact:true}).click();
 }
 await page.getByRole('button',{name:'创建 Skill',exact:true}).click();
 const accountPrompt=page.getByRole('heading',{name:'登录后开始培养',exact:true});
 if(await accountPrompt.isVisible().catch(()=>false)){
  const registerNow=page.getByRole('button',{name:'创建新账号',exact:true});
  if(await registerNow.isVisible().catch(()=>false)){
   await registerNow.click();
   await page.getByLabel('名字',{exact:true}).fill('浏览器测试用户');
   await page.getByLabel('邮箱',{exact:true}).fill(`browser-${Date.now()}@example.test`);
   await page.getByLabel('密码（至少 12 字符）').fill('browser-password-123');
   await page.getByRole('button',{name:'注册并登录',exact:true}).click();
  }
  await expect(page.getByRole('heading',{name:'我的身份',exact:true})).toBeVisible({timeout:15000});
  await page.getByRole('button',{name:'创建 Skill',exact:true}).click();
 }
 const skipDistill=page.getByRole('button',{name:'跳过提炼，手动填写',exact:true});
 if(await skipDistill.isVisible().catch(()=>false)) await skipDistill.click();
 const title='浏览器验证方法 '+Date.now();
 await page.getByLabel('Skill 名称',{exact:true}).fill(title);
 for(const label of ['它解决什么问题','使用者需要提供什么输入','预期获得什么输出','工作步骤（每行一步）','一个真实案例','适用边界与已知局限'])await page.getByLabel(label,{exact:true}).fill('真实测试内容：观察问题、比较证据、验证结果。');
 await page.getByRole('button',{name:'发布 Skill',exact:true}).click();
 await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 await page.getByRole('button',{name:'收藏方法',exact:true}).click();await expect(page.getByRole('button',{name:'已收藏 · 取消收藏'})).toBeVisible();
 await page.getByRole('button',{name:'编辑 / 发布新版本',exact:true}).click();
 await page.getByLabel('这次改进了什么',{exact:true}).fill('新增反例检查');
 await page.getByRole('button',{name:'发布新版本',exact:true}).click();
 await expect(page.getByText('公开方法 · v2',{exact:true})).toBeVisible();
 await page.getByText('版本历史（2）',{exact:true}).click();await expect(page.getByText(/新增反例检查/).first()).toBeVisible();
 await page.setViewportSize({width:375,height:812});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'outputs/studio-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'outputs/studio-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
 await page.getByRole('button',{name:'编辑 / 发布新版本',exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'删除 Skill',exact:true}).click();
 await expect(page.getByRole('heading',{name:'这里还在等待第一颗种子',exact:true})).toBeVisible();
});
