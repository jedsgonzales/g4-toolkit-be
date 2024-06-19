import { User } from 'src/graphql/models/db/user.model';

interface RequestWithUser extends Request {
  user?: User;
}

export interface GraphQLContext {
  req: RequestWithUser;
}
