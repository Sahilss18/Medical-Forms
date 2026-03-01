import { Injectable, BadRequestException } from '@nestjs/common';
import { Application, ApplicationStatus } from './entities/application.entity';

@Injectable()
export class WorkflowService {
  private readonly allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.SCRUTINY],
    [ApplicationStatus.SCRUTINY]: [ApplicationStatus.CLARIFICATION, ApplicationStatus.INSPECTION_ASSIGNED, ApplicationStatus.REJECTED],
    [ApplicationStatus.CLARIFICATION]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.INSPECTION_ASSIGNED]: [ApplicationStatus.INSPECTION_COMPLETED],
    [ApplicationStatus.INSPECTION_COMPLETED]: [ApplicationStatus.DECISION_PENDING],
    [ApplicationStatus.DECISION_PENDING]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
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
