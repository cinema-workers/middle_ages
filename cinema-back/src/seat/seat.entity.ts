import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from '../order/order.entity';
import { Session } from '../session/session.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  number: number;

  @ManyToOne(() => Order, (order) => order.seats)
  order: Order;

  @ManyToOne(() => Session, (session) => session.seats)
  session: Session;
}