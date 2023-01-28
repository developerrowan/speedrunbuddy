import { ClientWrapper } from './command-dispatch.service';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import CommandDispatchService, { Command } from './command-dispatch.service';

let mockWrapper: ClientWrapper;

describe('Command Dispatch Service', () => {
  beforeAll(() => {
    mockWrapper = {
      channel: {
        channelName: 'testchannel',
        ircChannelName: '#testchannel',
        displayName: 'TestChannel',
      },
    } as ClientWrapper;
  });

  it('should register no commands when an empty command list is passed to registerAll', () => {
    // Arrange
    const commands: Command[] = [];
    const registerSpy = vi.spyOn(CommandDispatchService, 'register');

    // Act
    CommandDispatchService.registerAll(commands);

    // Assert
    expect(registerSpy).toHaveBeenCalledTimes(0);
  });

  it('should register all commands on call of registerAll', () => {
    // Arrange
    const commands: Command[] = [
      {
        commandName: 'test',
        commandAction: () => {
          return;
        },
      },
      {
        commandName: 'anothertest',
        commandAction: () => {
          return;
        },
      },
      {
        commandName: 'test2',
        commandAction: () => {
          return;
        },
      },
    ];

    const registerSpy = vi.spyOn(CommandDispatchService, 'register');

    // Act
    CommandDispatchService.registerAll(commands);

    // Assert
    expect(registerSpy).toHaveBeenCalledTimes(3);
  });

  it('should do nothing if the message provided is not a command', () => {
    // Arrange
    const message = 'Not a command!';
    const matchSpy = vi.spyOn(String.prototype, 'match');

    // Act
    CommandDispatchService.execute(message, mockWrapper);

    // Assert
    expect(matchSpy).toHaveBeenCalledTimes(0);
  });
});
