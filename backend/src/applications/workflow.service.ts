import { Injectable, BadRequestException } from '@nestjs/common';
import { Application, ApplicationStatus } from './entities/application.entity';

@Injectable()
export class WorkflowService {
  private readonly allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.SCRUTINY, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.SCRUTINY]: [ApplicationStatus.CLARIFICATION, ApplicationStatus.INSPECTION_ASSIGNED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.CLARIFICATION]: [ApplicationStatus.SUBMITTED, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.INSPECTION_ASSIGNED]: [ApplicationStatus.INSPECTION_COMPLETED, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.INSPECTION_COMPLETED]: [ApplicationStatus.DECISION_PENDING, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.DECISION_PENDING]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
    [ApplicationStatus.WITHDRAWN]: [], // End state
    [ApplicationStatus.APPROVED]: [], // End state
    [ApplicationStatus.REJECTED]: [], // End state
  };

  validateTransition(current: ApplicationStatus, next: ApplicationStatus) {
    const transitions = this.allowedTransitions[current];
    if (!transitions || !transitions.includes(next)) {
      throw new BadRequestException(`Invalid transition from ${current} to ${next}`);
    }
    return true;
  }
}
