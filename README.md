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

### project
| Attr | Type | Required | Desc |
| :----:| :----: | :----: | :----: |
| name | string | Y | 名称 |
| workspaceId | string | Y | 工作区id($id) |
| imageUrl | string |  | 项目图标 |
| $id | string | Y | 自动创建id |