import axios from 'axios';

export const queryGqlAPI = async (
  endpoint: string,
  graphqlQuery: string,
  variables: any = {},
) => {
  return await axios.post(
    endpoint,
    {
      query: graphqlQuery,
      variables,
    },
    {
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
    },
  );
};

export const REPORT_NEW_SYSTEM_FILTER = `
  query AnnounceNewSystemFilter($id: String!) {
    AnnounceNewSystemFilter(id: $id) {
      Id
      RuleName
      OrderNo
      Ip
      DeviceId
      SubnetId
      FilterAction
      DetectedOn
      UpdatedOn
      UpdatedBy
    }
  }
`;

export const REPORT_NEW_BROADCASTER = `
  query AnnounceNewBroadcaster($ip: String!) {
    AnnounceNewBroadcaster(ip: $ip) {
      Id
      Name
      AllowDevicesByDefault
      Enabled
      EnabledOn
      EnabledBy
      DisabledOn
      DisabledBy
      DetectedOn
      LastMsgOn
    }
  }
`;

export const REPORT_NEW_DEVICE = `
  query AnnounceNewDevice($ip: String!, $id: Int!, $subnet: Int!) {
    AnnounceNewDevice(ip: $ip, id: $id, subnet: $subnet) {
      Id
      Name
      AllowDevicesByDefault
      Enabled
      EnabledOn
      EnabledBy
      DisabledOn
      DisabledBy
      DetectedOn
      LastMsgOn
    }
  }
`;

export const REPORT_CHANNEL_NODE_UPDATE = `
  query AnnounceNodeStateChanged($id: Int!) {
    AnnounceNodeStateChanged(id: $id) {
      Id
      NetworkDevId
      NodeNo
      NodeType
      NodeDesc
      CustomDesc
      NetworkDevice {
        Id
        CustomDesc
        DeviceId
        SubnetId
        DeviceType
        BroadcasterId
        AreaId
        Enabled
        EnabledOn
        EnabledBy
        DisabledOn
        DisabledBy
      }
      Status {
        Id
        StateName
        StateValue
        StateType
      }
    }
  }
`;

export const REPORT_AREA_OCCUPANCY_STATUS = `
  query AnnounceAreaOccupancy($id: Int!) {
    AnnounceAreaOccupancy(id: $id) {
      Id
      Name
      Details
      ParentAreaId
      CreatedOn
      CreatedBy
      UpdatedOn
      UpdatedBy
      ParentArea {
        Id
        Name
        Details
        ParentAreaId
        CreatedOn
        CreatedBy
        UpdatedOn
        UpdatedBy
      }
    }
  }
`;
