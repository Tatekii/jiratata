# 非常magic的jira clone

## client
- `Next`

## server
- `Hono`
- `apprite SDK`

## Appwrite Collections
### user
| Attr | Type | Required | Desc |
| :----:| :----: | :----: | :----: |
| $id | string | Y | 自动创建id |

### workspaces
| Attr | Type | Required | Desc |
| :----:| :----: | :----: | :----: |
| name | string | Y | 工作区名 |
| userId | string | Y | 用户id($id) |
| imageUrl | string |  | 工作区图标 |
| inviteCode | string | Y | 邀请码 |
| $id | string | Y | 自动创建id |

### members
| Attr | Type | Required | Desc |
| :----:| :----: | :----: | :----: |
| userId | string | Y | 用户id($id) |
| workspaceId | string | Y | 工作区id($id) |
| role | emum | Y | 成员角色 |
| $id | string | Y | 自动创建id |

### projects
| Attr | Type | Required | Desc |
| :----:| :----: | :----: | :----: |
| name | string | Y | 名称 |
| workspaceId | string | Y | 工作区id($id) |
| imageUrl | string |  | 项目图标 |
| $id | string | Y | 自动创建id |

### tasks
| Attr | Type | Required | Desc |
| :----:| :----: | :----: | :----: |
| name | string | Y | 名称 |
| description | string |  | 描述 |
| workspaceId | string | Y | 工作区id($id) |
| projectId | string | Y | 项目id($id) |
| dueDate | Datetime | Y | 到期时间 |
| assigneeId | string | Y | 负责人id($id) |
| status | enum | Y | BACKLOG/TODO/DONE/IN_REVIEW/IN_PROGRESS |
| position | integer | Y |  |
| $id | string | Y | 自动创建id |


## Project Structure
1. [lang]
在第一层路径控制多语言，并通过next middleware切换
1. (dashboard)和(standalone)
控制不同路径深度使用带控制面板侧边栏的layout

## TODO
1. 自定义task状态