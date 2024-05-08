import { OverrideOpts } from '@localtypes';
import {
  DeviceChannelNode,
  ChannelStatus,
  NetworkDevice,
} from '@internal/prisma/smartg4';
import { prismaService } from 'src/services/db';
import { DateTime } from 'luxon';
import { isDeepStrictEqual } from 'util';
/* import { pause } from 'src/utils/pause'; */

export const ChannelNodeType = 'ChannelNode';

export abstract class ChannelNode<T, C> {
  NetworkDevice: NetworkDevice;

  Id: number = 0;
  NodeType: string = ChannelNodeType;
  NodeNo: number = 1;
  NodeDesc: string = '';
  CustomDesc: string = '';

  State: T;
  NewState: T = undefined;

  constructor(props: T) {
    this.State = props;
  }

  abstract setState(newState: C & OverrideOpts);
  abstract queryStatus(opts: OverrideOpts);

  loadDbState(dbNode: DeviceChannelNode & { Status: ChannelStatus[] }) {
    this.State ||= {} as T;
    for (const dbState of dbNode.Status) {
      this.State[dbState.StateName] =
        dbState.StateType === 'number'
          ? Number(dbState.StateValue)
          : dbState.StateType === 'boolean'
            ? Boolean(dbState.StateValue)
            : dbState.StateValue;
    }
  }

  loadDbNode(node: DeviceChannelNode & { NetworkDevice?: NetworkDevice }) {
    this.Id = node.Id;
    this.NodeNo = node.NodeNo;
    this.NodeType = node.NodeType;
    this.NodeDesc = node.NodeDesc;
    this.CustomDesc = node.CustomDesc;
    this.NetworkDevice = node.NetworkDevice;
  }

  updateState(newState: T) {
    this.NewState = newState;
  }

  async syncNode() {
    if (!this.NetworkDevice) {
      throw new Error('NetworkDevice is not defined');
    }

    if (!this.Id) {
      this.Id = (
        await prismaService.deviceChannelNode.create({
          data: {
            NetworkDevice: { connect: { Id: this.NetworkDevice.Id } },
            NodeNo: this.NodeNo,
            NodeType: this.NodeType,
            NodeDesc: this.NodeDesc,
            CustomDesc: this.CustomDesc,
          },
        })
      ).Id;

      console.log('Created node', this.Id, this.NodeType);
    } else {
      await prismaService.deviceChannelNode.update({
        where: {
          Id: this.Id,
        },
        data: {
          NetworkDevice: { connect: { Id: this.NetworkDevice.Id } },
          NodeNo: this.NodeNo,
          NodeType: this.NodeType,
          NodeDesc: this.NodeDesc,
          CustomDesc: this.CustomDesc,
        },
      });

      console.log('Updated node', this.Id, this.NodeType);
    }
  }

  async syncState() {
    if (!this.NetworkDevice) {
      throw new Error('NetworkDevice is not defined');
    }

    if (!this.Id) {
      throw new Error('ChannelNode is not saved');
    }

    if (!this.NewState) {
      return; // nothing to save
    }

    if (isDeepStrictEqual(this.State, this.NewState)) {
      return; // nothing to save
    }

    const currTs = DateTime.now().toMillis();
    const delKeys: string[] = [];

    for (const key of Object.keys(this.State)) {
      if (this.NewState[key] === undefined) {
        delKeys.push(key); // old state key deleted on new state key
      }
    }

    const SaveState = { ...this.State, ...this.NewState };
    for (const delKey of delKeys) {
      delete SaveState[delKey];
    }

    const stateKeys = Object.keys(SaveState);
    // const upserts: any[] = [];
    for (const key of stateKeys) {
      const id = `${this.NetworkDevice.Id}/${this.NodeType}/${this.Id}/${key}`;

      // upserts.push(
      await prismaService.channelStatus.upsert({
        where: {
          Id: id,
        },
        create: {
          Id: id,
          StateName: key,
          StateValue: SaveState[key].toString(),
          StateType: typeof SaveState[key],
          Channel: {
            connect: { Id: this.Id },
          },
        },
        update: {
          StateName: key,
          StateValue: SaveState[key].toString(),
          StateType: typeof SaveState[key],
        },
      });
      //);

      // await pause(100);
    }

    // await prismaService.$transaction(upserts);

    if (delKeys.length > 0) {
      await prismaService.channelStatus.deleteMany({
        where: {
          ChannelId: this.Id,
          StateName: { in: delKeys },
        },
      });
    }

    // save state history if required
    if (this.NetworkDevice.StatusHistory) {
      await prismaService.channelStatusHistory.create({
        data: {
          Id: `${this.NetworkDevice.Id}/${this.Id}/${currTs}`,
          Time: currTs,
          State: JSON.stringify(SaveState),
          Channel: {
            connect: { Id: this.Id },
          },
        },
      });
    }

    this.State = SaveState;
    this.NewState = undefined;
  }
}
