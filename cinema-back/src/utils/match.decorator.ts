import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ClassConstructor } from 'class-transformer';

export const Match = <T>(
  type: ClassConstructor<T>,
  property: (o: T) => any,
  validationOptions?: ValidationOptions,
) => {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
};

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [fn] = args.constraints;
    return fn(args.object) === value;
  }

  defaultMessage() {
    return 'Пароль и повтор пароля не совпадают';
  }
}
