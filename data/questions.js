export const questions = [
  {
    id: 'q1', dimension: 'inner', prompt: '一个完全空出来的周末，你最想怎样度过？',
    note: '没有必须完成的事，也没有人等你回复。',
    options: [
      { label: '临时约人出门，去人多的地方看看', value: 12 },
      { label: '和一两个熟人吃饭、散步', value: 38 },
      { label: '留大半天给自己，晚上再见人', value: 68 },
      { label: '关掉消息，一个人慢慢恢复', value: 94 },
    ],
  },
  {
    id: 'q2', dimension: 'structure', prompt: '出发旅行前，你通常会准备到什么程度？',
    note: '想象这是一趟五天左右、第一次去的城市。',
    options: [
      { label: '先买票，到了再说', value: 10 },
      { label: '只定住宿和几个想去的地方', value: 36 },
      { label: '大致排好每天的区域和重点', value: 70 },
      { label: '路线、预约和备选方案都会整理好', value: 96 },
    ],
  },
  {
    id: 'q3', dimension: 'intensity', prompt: '一首歌突然击中你时，你更接近哪种反应？',
    note: '不是“应该怎样”，而是最真实的第一反应。',
    options: [
      { label: '觉得好听，听完就继续做事', value: 15 },
      { label: '会收藏，偶尔再听', value: 40 },
      { label: '循环很多遍，情绪会被带走', value: 74 },
      { label: '它会和某段记忆绑在一起很久', value: 96 },
    ],
  },
  {
    id: 'q4', dimension: 'idealism', prompt: '面对一份稳定但并不喜欢的工作，你更可能怎么想？',
    note: '假设收入足够生活，但内容让你逐渐麻木。',
    options: [
      { label: '稳定最重要，兴趣可以放在下班后', value: 12 },
      { label: '先留下，同时寻找更合适的机会', value: 42 },
      { label: '愿意承担一些风险，换取真正想做的事', value: 76 },
      { label: '如果失去意义，再稳定也很难继续', value: 96 },
    ],
  },
  {
    id: 'q5', dimension: 'connection', prompt: '朋友心情很差却说“没事”，你通常会怎么做？',
    note: '对方没有明确求助。',
    options: [
      { label: '尊重他的空间，不继续追问', value: 18 },
      { label: '简单说一句“需要时找我”', value: 42 },
      { label: '找个自然的理由陪一会儿', value: 72 },
      { label: '会认真确认，不想让他一个人扛', value: 94 },
    ],
  },
  {
    id: 'q6', dimension: 'novelty', prompt: '去餐厅时，你更常选择哪一种？',
    note: '假设价格和距离都差不多。',
    options: [
      { label: '一定点自己最熟悉、最稳妥的菜', value: 12 },
      { label: '熟悉的为主，偶尔加一道新菜', value: 38 },
      { label: '更愿意尝试没吃过的组合', value: 72 },
      { label: '越奇怪越想试，踩雷也算经历', value: 96 },
    ],
  },
  {
    id: 'q7', dimension: 'agency', prompt: '一群人迟迟决定不了去哪儿，你会怎么做？',
    note: '大家都说“随便”，时间已经不早了。',
    options: [
      { label: '继续等别人决定，我配合就好', value: 12 },
      { label: '提一两个建议，但不坚持', value: 40 },
      { label: '快速整理选项，让大家投票', value: 74 },
      { label: '直接拍板一个合理方案，先出发', value: 96 },
    ],
  },
  {
    id: 'q8', dimension: 'brightness', prompt: '下了一整天雨，你更容易注意到什么？',
    note: '你独自走在回家的路上。',
    options: [
      { label: '天气让整座城市显得有些沉重', value: 12 },
      { label: '会想起一些过去的事', value: 38 },
      { label: '雨声和路灯其实很有氛围', value: 72 },
      { label: '会期待回家后的热饮和干净衣服', value: 94 },
    ],
  },
  {
    id: 'q9', dimension: 'inner', prompt: '在一个几乎不认识人的聚会上，你通常怎样进入状态？',
    note: '没有熟人带着你。',
    options: [
      { label: '很快主动认识几个人', value: 10 },
      { label: '先找一个人聊起来，再慢慢扩展', value: 36 },
      { label: '观察一阵，等自然机会出现', value: 72 },
      { label: '会消耗很大，只想早点离开', value: 96 },
    ],
  },
  {
    id: 'q10', dimension: 'structure', prompt: '面对一个还有三周截止的任务，你更像哪一种？',
    note: '任务不算难，但步骤不少。',
    options: [
      { label: '最后几天集中完成，效率最高', value: 12 },
      { label: '想到时做一点，不固定节奏', value: 38 },
      { label: '会分成几段，按大致计划推进', value: 72 },
      { label: '尽早列步骤和时间点，逐项完成', value: 96 },
    ],
  },
  {
    id: 'q11', dimension: 'intensity', prompt: '和重要的人发生误会后，你的情绪通常会持续多久？',
    note: '误会还没有完全解释清楚。',
    options: [
      { label: '很快能放到一边，等合适时再说', value: 14 },
      { label: '会在意，但不影响其他事情', value: 40 },
      { label: '脑中会反复回放对话', value: 76 },
      { label: '在解决之前，很难真正松下来', value: 96 },
    ],
  },
  {
    id: 'q12', dimension: 'idealism', prompt: '一座城市最吸引你的地方是什么？',
    note: '不考虑工作机会和房价。',
    options: [
      { label: '生活方便，运转高效', value: 16 },
      { label: '有熟悉的人和稳定日常', value: 40 },
      { label: '文化、气质和某种想象空间', value: 76 },
      { label: '它能让我觉得人生可以有另一种版本', value: 98 },
    ],
  },
  {
    id: 'q13', dimension: 'connection', prompt: '一段很好的回忆，对你来说通常因为什么成立？',
    note: '从最近几年里想一个真正喜欢的片段。',
    options: [
      { label: '我当时很自由，不需要照顾任何人', value: 16 },
      { label: '环境和事情本身很特别', value: 40 },
      { label: '有人和我一起经历并理解那个时刻', value: 74 },
      { label: '重要的人都在，而且彼此很靠近', value: 96 },
    ],
  },
  {
    id: 'q14', dimension: 'novelty', prompt: '走一条熟悉的路时，你会不会突然换路线？',
    note: '新路线可能多花十分钟。',
    options: [
      { label: '不会，熟悉路线最省心', value: 10 },
      { label: '有明确理由才会换', value: 36 },
      { label: '偶尔会，只是想看看别处', value: 72 },
      { label: '经常如此，我喜欢不知道下一段是什么', value: 96 },
    ],
  },
  {
    id: 'q15', dimension: 'agency', prompt: '有人越过了你的边界，你更可能怎样处理？',
    note: '对方未必是故意，但这件事让你不舒服。',
    options: [
      { label: '先忍过去，不想把关系弄僵', value: 10 },
      { label: '减少接触，用距离表达', value: 38 },
      { label: '找机会平静说明自己的感受', value: 74 },
      { label: '当下就明确指出，避免再次发生', value: 96 },
    ],
  },
  {
    id: 'q16', dimension: 'brightness', prompt: '当计划被打乱时，你的第一念头更接近哪一句？',
    note: '这件事有点麻烦，但并非灾难。',
    options: [
      { label: '果然，事情总会往坏处偏', value: 10 },
      { label: '先让我缓一会儿，再处理', value: 38 },
      { label: '不一定是坏事，看看还有什么可能', value: 74 },
      { label: '好吧，新的剧情开始了', value: 96 },
    ],
  },
  {
    id: 'q17', dimension: 'inner', prompt: '收到一个特别好的消息时，你最先想做什么？',
    note: '这是对你很重要的消息。',
    options: [
      { label: '立刻告诉很多人，一起开心', value: 10 },
      { label: '先告诉最亲近的几个人', value: 38 },
      { label: '自己确认和消化一阵，再分享', value: 72 },
      { label: '会先安静地保留，甚至不太想说', value: 94 },
    ],
  },
  {
    id: 'q18', dimension: 'structure', prompt: '你的桌面或房间通常更接近哪种状态？',
    note: '按平时，不是大扫除之后。',
    options: [
      { label: '东西很多，位置随时变化', value: 10 },
      { label: '看着有点乱，但我知道在哪', value: 36 },
      { label: '大体整齐，常用物品有固定位置', value: 72 },
      { label: '分类清楚，乱了会影响我的状态', value: 96 },
    ],
  },
  {
    id: 'q19', dimension: 'intensity', prompt: '你更容易被哪一种故事打动？',
    note: '不考虑题材，只考虑情感方式。',
    options: [
      { label: '轻松、有趣、看完心情不错', value: 14 },
      { label: '温暖真实，但不太沉重', value: 40 },
      { label: '有遗憾、有余味，能想很久', value: 76 },
      { label: '情绪极强，哪怕看完会难受', value: 98 },
    ],
  },
  {
    id: 'q20', dimension: 'idealism', prompt: '看到明显不公平的事情时，你通常如何反应？',
    note: '你不一定直接卷入其中。',
    options: [
      { label: '先判断是否与我有关、能否改变', value: 18 },
      { label: '会不舒服，但更关注实际解决办法', value: 44 },
      { label: '很难装作没看见，愿意表达立场', value: 78 },
      { label: '即使代价不小，也希望站在正确一边', value: 98 },
    ],
  },
  {
    id: 'q21', dimension: 'connection', prompt: '团队合作时，你最舒服的位置是什么？',
    note: '团队成员能力都不错。',
    options: [
      { label: '负责独立模块，尽量少开会', value: 14 },
      { label: '有明确分工，需要时同步', value: 40 },
      { label: '经常交流，彼此补充想法', value: 74 },
      { label: '共同推进，过程中的连接也很重要', value: 96 },
    ],
  },
  {
    id: 'q22', dimension: 'novelty', prompt: '如果要换一种完全不同的穿衣风格，你会怎样？',
    note: '不考虑预算。',
    options: [
      { label: '不会换，适合自己的已经很明确', value: 12 },
      { label: '从一个小单品开始试', value: 40 },
      { label: '愿意尝试一套明显不同的搭配', value: 74 },
      { label: '很期待，甚至想彻底改变形象', value: 96 },
    ],
  },
  {
    id: 'q23', dimension: 'agency', prompt: '遇到一个很想争取、但成功率不高的机会，你会怎么做？',
    note: '失败不会造成严重后果。',
    options: [
      { label: '大概率不投，避免浪费时间', value: 12 },
      { label: '观望一下，准备充分再决定', value: 40 },
      { label: '会认真尝试，至少得到反馈', value: 76 },
      { label: '马上行动，边做边提高胜算', value: 98 },
    ],
  },
  {
    id: 'q24', dimension: 'brightness', prompt: '别人通常怎样形容你的底色？',
    note: '不是你希望成为的样子，而是别人常说的。',
    options: [
      { label: '有点冷、有距离感', value: 14 },
      { label: '安静稳重，不太外露', value: 40 },
      { label: '温和、容易相处', value: 74 },
      { label: '明亮、有感染力', value: 96 },
    ],
  },
  {
    id: 'q25', dimension: 'inner', prompt: '一次长时间社交结束后，你通常怎样恢复？',
    note: '活动本身很愉快，没有发生不好的事。',
    options: [
      { label: '还想续摊，状态正好', value: 8 },
      { label: '有点累，但心情很好', value: 34 },
      { label: '需要安静一阵才能重新集中', value: 72 },
      { label: '必须独处很久，连消息都不想看', value: 98 },
    ],
  },
  {
    id: 'q26', dimension: 'structure', prompt: '准备送一个重要礼物时，你更像哪一种？',
    note: '对方对你很重要。',
    options: [
      { label: '看到合适的就买，靠直觉', value: 14 },
      { label: '平时留意，临近时再决定', value: 40 },
      { label: '提前想好方向，比较几种选择', value: 74 },
      { label: '会记录线索、预算和时间，确保没有疏漏', value: 96 },
    ],
  },
  {
    id: 'q27', dimension: 'intensity', prompt: '喜欢一个人时，你的情感通常如何存在？',
    note: '不考虑你是否会立刻表达。',
    options: [
      { label: '相处舒服就好，不会想太多', value: 12 },
      { label: '会期待，但还能保持自己的节奏', value: 40 },
      { label: '很多细节都会变得有意义', value: 76 },
      { label: '像进入另一种气候，生活都会被改变', value: 98 },
    ],
  },
  {
    id: 'q28', dimension: 'idealism', prompt: '想象十年后的自己，你最在意什么？',
    note: '只选最先浮现的一项。',
    options: [
      { label: '生活稳定，风险可控', value: 14 },
      { label: '能力和收入都比现在更扎实', value: 40 },
      { label: '做着真正认可的事，身边有重要的人', value: 78 },
      { label: '没有为了现实把最初的自己弄丢', value: 98 },
    ],
  },
  {
    id: 'q29', dimension: 'connection', prompt: '和朋友一起旅行时，你最在意什么？',
    note: '目的地本身大家都喜欢。',
    options: [
      { label: '彼此保留自由时间，不要一直绑定', value: 12 },
      { label: '分工清楚，别互相添麻烦', value: 38 },
      { label: '节奏合拍，能一起商量', value: 72 },
      { label: '共同经历本身比打卡多少更重要', value: 96 },
    ],
  },
  {
    id: 'q30', dimension: 'novelty', prompt: '生活突然出现一个彻底改变方向的机会，你更接近哪种心情？',
    note: '机会真实，但意味着离开熟悉环境。',
    options: [
      { label: '本能抗拒，我更需要可预测', value: 10 },
      { label: '会谨慎评估，除非收益很明确', value: 38 },
      { label: '紧张但兴奋，愿意认真考虑', value: 74 },
      { label: '第一反应是：终于来了', value: 98 },
    ],
  },
  {
    id: 'q31', dimension: 'agency', prompt: '和别人意见明显不同时，你通常怎样表达？',
    note: '对方不是你的上级，也不会因此报复你。',
    options: [
      { label: '能不说就不说，避免冲突', value: 10 },
      { label: '用比较委婉的方式暗示', value: 38 },
      { label: '直接说明理由，也听对方解释', value: 76 },
      { label: '会清楚坚持，直到问题得到处理', value: 96 },
    ],
  },
  {
    id: 'q32', dimension: 'brightness', prompt: '回想过去时，你更常停在哪一类记忆里？',
    note: '不是最重要的记忆，而是最容易自己浮现的。',
    options: [
      { label: '错过、遗憾和没有说完的事', value: 10 },
      { label: '复杂的片段，好坏混在一起', value: 40 },
      { label: '温柔的小事和被理解的时刻', value: 74 },
      { label: '好笑、明亮、想起来仍会开心的瞬间', value: 96 },
    ],
  },
];
