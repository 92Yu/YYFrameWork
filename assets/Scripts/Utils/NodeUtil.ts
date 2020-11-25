/**
 * 节点相关工具
 *      getRelativePosition:获取节点在目标节点（容器）下的相对位置
 *      bPosOnNodeRect:坐标是否在目标节点范围内
 */
let NodeUtil = new class {
    /**
     * 获取节点在目标节点（容器）下的相对位置
     * @param node 节点
     * @param target 目标节点（容器）
     */
    public static getRelativePosition(node: cc.Node, target: cc.Node): cc.Vec2 {
        const worldPos = (node.getParent() || node).convertToWorldSpaceAR(node.getPosition());
        return target.convertToNodeSpaceAR(worldPos);
    }

    /**
     * 坐标是否在目标节点范围内
     * @param pos 坐标
     * @param target 目标节点
     */
    public static bPosOnNodeRect(pos: cc.Vec2, target: cc.Node): boolean {
        const rect = target.getBoundingBoxToWorld();
        return rect.contains(pos);
    }
}
Window['NodeUtil'] = NodeUtil;