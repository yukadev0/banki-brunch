import type {
  ServerMessage,
  UserId,
  UserInfo,
  UserRole,
} from "workers/durableObjects/brunchRoom/types";
import type BrunchRoomApp from "../BrunchRoomApp";

export default class UserManager {
  private m_brunchApp: BrunchRoomApp;
  private m_selfUser: UserInfo | null = null;
  private m_users: Map<UserId, UserInfo> = new Map<UserId, UserInfo>();

  constructor(brunchApp: BrunchRoomApp) {
    this.m_brunchApp = brunchApp;
  }

  public setUsers(users: UserInfo[]) {
    this.m_users = new Map(users.map((user) => [user.id, user]));
    this.m_selfUser = this.m_users.get(this.m_brunchApp.selfId)!;
  }

  public getUsers() {
    return [...this.m_users.values()];
  }

  public getSelfUser() {
    return this.m_selfUser;
  }

  public getUserInfo(userId: UserId) {
    return this.m_users.get(userId);
  }

  public setUserInfo(userId: UserId, userInfo: UserInfo) {
    this.m_users.set(userId, userInfo);
  }

  public deleteUserInfo(userId: UserId) {
    this.m_users.delete(userId);
  }

  public hasUserInfo(userId: UserId) {
    return this.m_users.has(userId);
  }

  public isPresenter(userId: UserId) {
    const userInfo = this.getUserInfo(userId);
    return !!userInfo && userInfo.role === "presenter";
  }

  public changeUserRole(userId: UserId, newRole: UserRole) {
    const userInfo = this.getUserInfo(userId);
    if (userInfo) {
      userInfo.role = newRole;
    }
  }

  public getActiveUsers() {
    return this.getUsers().filter(
      (user) => user.role === "viewer" && !user.isLurking,
    );
  }

  public handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "users_snapshot":
        this.setUsers(data.users);
        break;
      case "user_role_changed":
        this.changeUserRole(data.id, data.role);
        break;
    }
  }

  public handleRequestSetTagPreferences = (tags: string[]) => {
    this.m_brunchApp.sendToServer({
      type: "request_set_tag_preferences",
      tags,
    });
  };

  public handleRequestTagChange = (userId: string) => {
    if (this.m_brunchApp.isSelfPresenter) {
      this.m_brunchApp.sendToServer({ type: "request_tag_change", userId });
    }
  };

  public handleRequestToggleLurking = () => {
    this.m_brunchApp.sendToServer({ type: "request_toggle_lurking" });
  };

  public handleRequestChangeRole = () => {
    this.m_brunchApp.sendToServer({ type: "request_change_role" });
  };
}
