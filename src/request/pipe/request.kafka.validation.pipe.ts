import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { Debugger } from 'src/debugger/debugger.decorator';
import { Logger as DebuggerService } from 'winston';
import { plainToInstance } from 'class-transformer';
import { RpcException } from '@nestjs/microservices';
import { ENUM_REQUEST_STATUS_CODE_ERROR } from '../request.constant';

export class RequestKafkaValidationPipe implements PipeTransform {
    constructor(
        @Debugger() private readonly debuggerService: DebuggerService
    ) {}

    async transform(
        value: Record<string, any>,
        { metatype }: ArgumentMetadata
    ): Promise<Record<string, any>> {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        const request = plainToInstance(metatype, value);
        this.debuggerService.info('Request Kafka Data', {
            class: 'RequestKafkaValidationPipe',
            function: 'transform',
            request: request,
        });

        const rawErrors: Record<string, any>[] = await validate(request);
        if (rawErrors.length > 0) {
            this.debuggerService.error('Request Kafka Errors', {
                class: 'RequestKafkaValidationPipe',
                function: 'transform',
                errors: rawErrors,
            });

            throw new RpcException({
                statusCode:
                    ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_KAFKA_VALIDATION_ERROR,
                message: 'http.clientError.unprocessableEntity',
                errors: rawErrors,
            });
        }

        return value;
    }

    private toValidate(metatype: Record<string, any>): boolean {
        const types: Record<string, any>[] = [];
        return types.includes(metatype);
    }
}
