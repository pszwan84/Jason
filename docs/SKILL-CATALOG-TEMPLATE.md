# Skill Mock 目录怎么换货

货架是 JSON，不是 `page.tsx`。改完刷新即可。

- `D:\资料\项目与代码\Jason\skill-zoo\data\people.json` — 作者
- `D:\资料\项目与代码\Jason\skill-zoo\data\skills.json` — Skill

当前种子：13 人 × 50 条。货来自演示馆区 + 本机真实方法蒸馏（公众号深读、横纵分析、网文质检等），写成知乎口吻的 5 步，不是 SKILL.md 安装包。

## 一条 Skill 必填

```json
{
  "id": 19,
  "title": "短标题",
  "authorId": "lin-ran",
  "category": "科研馆",
  "color": "lavender",
  "icon": "leaf",
  "days": 30,
  "cases": 8,
  "tag": ["系统思维", "跨界研究"],
  "desc": "卡片上的一句话。",
  "update": "最近发生了什么",
  "label": "完全开放",
  "problem": "它解决什么问题",
  "steps": ["第一步", "第二步", "第三步", "第四步", "第五步"],
  "limits": "边界条件，必须写",
  "story": "这套方法怎么长出来的",
  "source": "案例从哪来",
  "seed": {
    "likes": 2,
    "exchanges": 0,
    "comments": [{ "author": "王展韬", "text": "至少八个字的真实用法。" }]
  }
}
```

`label` 只能是 `完全开放` | `交换后开放` | `贡献后开放`。

`icon`：`scale` | `book` | `leaf` | `palette` | `briefcase` | `wrench` | `cap`。

`authorId` 必须在 `people.json` 里存在。

## 热度

```
heat = 10×赞 + 6×评 + 15×成交交换
```

`seed` 是开场热度。用户在浏览器里点的赞/评会另加，刷新不丢。热度只决定商城排序，换不到货。

## 不要写成

- Claude `SKILL.md` / 一键安装包
- 没有边界条件的万能方法
- 金融做局、积分商城、付费下载
