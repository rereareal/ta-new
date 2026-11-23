/** 顶部导航与管理员导航共用的高亮判断：首页或指定 exact 精确匹配，其余按路径段前缀。 */
export function isPathActive(path: string, currentPath: string, exact = false): boolean {
  if (exact || path === "/") {
    return currentPath === path;
  }
  return currentPath === path || currentPath.startsWith(`${path}/`);
}
