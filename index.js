import { LambdaActions } from 'lambda-actions';
import { $connect, $disconnect, setName, updateName, sendPublic, sendPrivate } from './actions.js';
AWS.config.update({ region: 'ap-southeast-2' });
import AWS from 'aws-sdk';

export const handler = async (event, context) => {

  if (!event.requestContext) {
    return {};
  }

  try {

    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;
    const body = JSON.parse(event.body || '{}');

    const lambdaActions = new LambdaActions();
    lambdaActions.action('$connect', $connect);
    lambdaActions.action('$disconnect', $disconnect);
    lambdaActions.action('setName', setName);
    lambdaActions.action('updateName', updateName);
    lambdaActions.action('sendPublic', sendPublic);
    lambdaActions.action('sendPrivate', sendPrivate);

    await lambdaActions.fire({
      action: routeKey,
      payload: body,
      meta: { connectionId },
    });

  } catch (err) {
    console.error(err);
  }

  return {};
};

